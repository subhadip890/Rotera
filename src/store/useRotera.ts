import { create } from "zustand";
import { makeDemoCircle, YOU_ID, type Circle } from "@/lib/rotera";
import { connectFreighter } from "@/lib/stellar";
import { identifyUser, trackEvent } from "@/lib/posthog";
import { captureException } from "@/lib/sentry";

type WalletState = "disconnected" | "connecting" | "connected" | "rejected";

type RoteraStore = {
  wallet: WalletState;
  address: string | null;
  balance: number;
  walletError: string | null;
  circle: Circle | null;
  joined: boolean;
  lastPayout: { recipient: string; amount: number; cycle: number } | null;
  onboardingDone: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  loadDemoCircle: () => void;
  payShare: () => void;
  closeCycle: () => void;
  dismissPayout: () => void;
  finishOnboarding: () => void;
};

const STORAGE_WALLET_KEY = "rotera_connected_address";

export const useRotera = create<RoteraStore>((set, get) => ({
  wallet: localStorage.getItem(STORAGE_WALLET_KEY) ? "connected" : "disconnected",
  address: localStorage.getItem(STORAGE_WALLET_KEY) || null,
  balance: 1840.5,
  walletError: null,
  circle: null,
  joined: false,
  lastPayout: null,
  onboardingDone: false,

  connect: async () => {
    set({ wallet: "connecting", walletError: null });
    try {
      const realAddress = await connectFreighter();
      localStorage.setItem(STORAGE_WALLET_KEY, realAddress);
      set({
        wallet: "connected",
        address: realAddress,
        walletError: null,
      });

      identifyUser(realAddress);
      trackEvent("wallet_connected", { wallet: "Freighter", address: realAddress });
    } catch (err: any) {
      console.warn("[Wallet Connect Fallback]:", err?.message || err);
      const errMsg = err?.message || "Freighter connection rejected or unavailable.";

      captureException(err, { context: "wallet_connect" });

      // Fallback for dev/demo if Freighter isn't installed
      const fallbackAddr = "GCKFBEIYTKP6RCZX6LQZ4H3PWQ2VMZ7NDLT3WA";
      set({
        wallet: "connected",
        address: fallbackAddr,
        walletError: errMsg,
      });

      identifyUser(fallbackAddr);
      trackEvent("wallet_connected_fallback", { address: fallbackAddr, originalError: errMsg });
    }
  },

  disconnect: () => {
    localStorage.removeItem(STORAGE_WALLET_KEY);
    set({ wallet: "disconnected", address: null, walletError: null });
    trackEvent("wallet_disconnected");
  },

  loadDemoCircle: () => {
    if (get().circle) return;
    set({ circle: makeDemoCircle(), joined: true });
  },

  payShare: () =>
    set((s) => {
      if (!s.circle) return s;
      trackEvent("contribution_made", {
        circle_id: s.circle.id,
        amount: s.circle.amount,
        cycle_number: s.circle.currentCycle,
      });
      return {
        circle: {
          ...s.circle,
          members: s.circle.members.map((m) =>
            m.id === YOU_ID ? { ...m, status: "paid" as const } : m,
          ),
        },
        balance: Math.max(0, s.balance - s.circle.amount),
      };
    }),

  closeCycle: () =>
    set((s) => {
      if (!s.circle) return s;
      const c = s.circle;
      const recipient = c.members[c.currentSeat];
      if (!recipient) return s;
      const amount = c.amount * c.members.length;
      const nextSeat = (c.currentSeat + 1) % c.members.length;

      trackEvent("cycle_closed", {
        circle_id: c.id,
        cycle_number: c.currentCycle,
        recipient: recipient.name,
        amount,
      });

      return {
        lastPayout: { recipient: recipient.name, amount, cycle: c.currentCycle },
        circle: {
          ...c,
          currentCycle: c.currentCycle + 1,
          currentSeat: nextSeat,
          cutoff: Date.now() + 1000 * 60 * 60 * 24 * 7,
          members: c.members.map((m) => ({
            ...m,
            status: "waiting" as const,
            onTime: m.status === "paid" ? m.onTime + 1 : m.onTime,
            lateCount: m.status === "late" ? m.lateCount + 1 : m.lateCount,
          })),
          history: [
            ...c.history,
            {
              cycle: c.currentCycle,
              recipient: recipient.name,
              amount,
              date: new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              }),
            },
          ],
        },
      };
    }),

  dismissPayout: () => set({ lastPayout: null }),
  finishOnboarding: () => {
    set({ onboardingDone: true });
    trackEvent("onboarding_completed");
  },
}));
