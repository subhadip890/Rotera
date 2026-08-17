import { create } from "zustand";
import { connectFreighter, WalletConnectionError } from "@/lib/stellar";
import { identifyUser, trackEvent } from "@/lib/posthog";
import { captureException } from "@/lib/sentry";

type WalletState = "disconnected" | "connecting" | "connected" | "rejected";

const STORAGE_WALLET_KEY = "rotera_connected_address";
const SESSION_CIRCLE_KEY = "rotera_circle_id";

type RoteraStore = {
  wallet: WalletState;
  address: string | null;
  walletError: string | null;
  // UI-only state
  activeCircleId: string | null;
  lastPayout: { recipient: string; amount: number; cycle: number } | null;
  onboardingDone: boolean;
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  setActiveCircleId: (id: string) => void;
  setLastPayout: (payout: { recipient: string; amount: number; cycle: number } | null) => void;
  dismissPayout: () => void;
  finishOnboarding: () => void;
};

const getStoredAddress = (): string | null => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_WALLET_KEY);
  } catch {
    return null;
  }
};

const getStoredCircleId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_CIRCLE_KEY);
  } catch {
    return null;
  }
};

const initialAddress = getStoredAddress();

export const useRotera = create<RoteraStore>((set) => ({
  wallet: initialAddress ? "connected" : "disconnected",
  address: initialAddress,
  walletError: null,
  activeCircleId: getStoredCircleId(),
  lastPayout: null,
  onboardingDone: false,

  connect: async () => {
    set({ wallet: "connecting", walletError: null });
    try {
      const realAddress = await connectFreighter();

      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(STORAGE_WALLET_KEY, realAddress);
        } catch {
          // ignore storage errors
        }
      }

      set({
        wallet: "connected",
        address: realAddress,
        walletError: null,
      });

      identifyUser(realAddress);
      trackEvent("wallet_connected", { wallet: "Freighter", address: realAddress });
    } catch (err: any) {
      const errMsg =
        err instanceof WalletConnectionError
          ? err.message
          : err?.message || "Wallet connection failed.";

      const errCode = err instanceof WalletConnectionError ? err.code : "UNKNOWN";

      // NOT_INSTALLED is a user-facing condition (Freighter browser extension not present),
      // not an application error. Don't send it to Sentry — it would just create noise.
      // Unexpected errors (REJECTED, UNKNOWN, network failures) are still reported.
      if (!(err instanceof WalletConnectionError) || err.code !== "NOT_INSTALLED") {
        captureException(err, { context: "wallet_connect", code: errCode });
      }

      // Clear any stored address — do NOT fall back to a fake address
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_WALLET_KEY);
        } catch {
          // ignore
        }
      }

      set({
        wallet: "rejected",
        address: null,
        walletError: errMsg,
      });

      trackEvent("wallet_connect_failed", {
        error_code: errCode,
        error_message: errMsg,
      });
    }
  },

  disconnect: () => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_WALLET_KEY);
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(SESSION_CIRCLE_KEY);
      } catch {
        // ignore
      }
    }
    set({ wallet: "disconnected", address: null, activeCircleId: null, walletError: null });
    trackEvent("wallet_disconnected");
  },

  setActiveCircleId: (id: string) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SESSION_CIRCLE_KEY, id);
      } catch {
        // ignore
      }
    }
    set({ activeCircleId: id });
  },

  setLastPayout: (payout) => set({ lastPayout: payout }),
  dismissPayout: () => set({ lastPayout: null }),

  finishOnboarding: () => {
    set({ onboardingDone: true });
    trackEvent("onboarding_completed");
  },
}));
