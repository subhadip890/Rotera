/**
 * useSorobanQueries.ts
 *
 * TanStack Query hooks for Soroban on-chain state and mutations.
 * These are the ONLY source of truth for blockchain data.
 * Zustand is only used for UI state (wallet, onboarding, modals).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCircleStateOnChain,
  submitCreateCircle,
  submitJoinCircle,
  submitContribute,
  submitCloseCycle,
  submitWithdrawDeposit,
  submitRepayDebt,
  type OnChainCircle,
  stroopsToXlm,
  xlmToStroops,
} from "@/lib/soroban";
import { captureException } from "@/lib/sentry";
import { useRotera } from "@/store/useRotera";

// Re-export for convenience
export type { OnChainCircle };
export { stroopsToXlm, xlmToStroops };

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch and cache on-chain circle state.
 * Returns null if contract not configured or circle not found.
 */
export function useCircleState(circleId: string | number | null | undefined) {
  return useQuery({
    queryKey: ["circle", String(circleId)],
    queryFn: () => getCircleStateOnChain(circleId!),
    enabled: !!circleId && circleId !== "sunday-six" && circleId !== "demo",
    refetchInterval: 15_000,   // poll every 15s — not too aggressive
    staleTime: 8_000,
    retry: 2,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Create a circle on-chain.
 * On success returns { circleId: string, txHash: string }.
 */
export function useCreateCircleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      name: string;
      amount: number;      // XLM display value
      cadence: string;
      memberCount: number;
      payoutOrderType?: "Manual" | "RandomPending";
    }) =>
      submitCreateCircle({
        name: params.name,
        contributionAmount: xlmToStroops(params.amount),
        cycleLengthDays: cadenceToDays(params.cadence),
        memberCount: params.memberCount,
        payoutOrderType: params.payoutOrderType || "Manual",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["circle", data.circleId] });
    },
    onError: (err) => {
      captureException(err, { context: "useCreateCircleMutation" });
    },
  });
}

/**
 * Join a circle by ID.
 * Deposits XLM from the connected wallet to the contract.
 */
export function useJoinCircleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId }: { circleId: string | number }) =>
      submitJoinCircle(circleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["circle", String(variables.circleId)],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useJoinCircleMutation" });
    },
  });
}

/**
 * Contribute to the current cycle.
 * Transfers XLM from connected wallet to the contract.
 */
export function useContributeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      cycleNumber,
    }: {
      circleId: string | number;
      cycleNumber: number;
    }) => submitContribute(circleId, cycleNumber),
    onSuccess: (_, variables) => {
      // Force fresh chain data after contribution
      queryClient.invalidateQueries({
        queryKey: ["circle", String(variables.circleId)],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useContributeMutation" });
    },
  });
}

/**
 * Close the current cycle (permissionless keeper).
 * Triggers real XLM payout from contract to cycle recipient.
 */
export function useCloseCycleMutation() {
  const queryClient = useQueryClient();
  const { setLastPayout } = useRotera();

  return useMutation({
    mutationFn: ({
      circleId,
      cycleNumber,
    }: {
      circleId: string | number;
      cycleNumber: number;
      recipientName?: string;
      amountXlm?: number;
    }) => submitCloseCycle(circleId, cycleNumber),
    onSuccess: (_, variables) => {
      // Show the payout toast using UI-only state
      if (variables.recipientName && variables.amountXlm !== undefined) {
        setLastPayout({
          recipient: variables.recipientName,
          amount: variables.amountXlm,
          cycle: variables.cycleNumber,
        });
      }
      // Refresh chain state
      queryClient.invalidateQueries({
        queryKey: ["circle", String(variables.circleId)],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useCloseCycleMutation" });
    },
  });
}

/**
 * Withdraw deposit after circle completion.
 */
export function useWithdrawDepositMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ circleId }: { circleId: string | number }) =>
      submitWithdrawDeposit(circleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["circle", String(variables.circleId)],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useWithdrawDepositMutation" });
    },
  });
}

/**
 * Repay outstanding missed-payment debt on-chain.
 * Transfers real XLM from the member's wallet to the contract, reducing debt.
 */
export function useRepayDebtMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      circleId,
      amountStroops,
    }: {
      circleId: string | number;
      amountStroops: bigint;
    }) => submitRepayDebt(circleId, amountStroops),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["circle", String(variables.circleId)],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useRepayDebtMutation" });
    },
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Convert a cadence string or quick-test duration to the cycle_length_days value
 * passed to the Soroban contract's create_circle() function.
 *
 * CONTRACT TIMING SEMANTICS (calculate_deadline in lib.rs):
 *   value <= 3600  →  deadline = now + value          (treats value as SECONDS)
 *   value >  3600  →  deadline = now + value × 86400  (treats value as DAYS)
 *
 * ACTUAL BEHAVIOR — all current cadences send values <= 3600:
 *   "Weekly"         → 7   → 7  <= 3600 → deadline = now + 7s    (7 second cycle on Testnet)
 *   "Every two weeks"→ 14  → 14 <= 3600 → deadline = now + 14s   (14 second cycle on Testnet)
 *   "Monthly"        → 30  → 30 <= 3600 → deadline = now + 30s   (30 second cycle on Testnet)
 *   "10s"            → 10  → 10 <= 3600 → deadline = now + 10s
 *   "30s"            → 30  → 30 <= 3600 → deadline = now + 30s
 *   "60s"            → 60  → 60 <= 3600 → deadline = now + 60s
 *   "5min"           → 300 → 300 <= 3600→ deadline = now + 300s
 *
 * All cycles currently run in seconds on Testnet — this is correct behavior
 * for the Green Belt submission / fast demo workflow.
 *
 * For a true mainnet deployment, the contract would need a redeploy with
 * cycle_duration_seconds: u64 to accept raw seconds without the dual-mode branch.
 */
export function cadenceToDays(cadence: string): number {
  const lower = cadence.toLowerCase();

  // Explicit quick-test durations
  if (lower === "10s" || lower === "10 seconds") return 10;
  if (lower === "30s" || lower === "30 seconds") return 30;
  if (lower === "60s" || lower === "1 minute") return 60;
  if (lower === "5min" || lower === "5 minutes") return 300;

  // Named cadences — on Testnet these run in seconds (7s, 14s, 30s)
  if (lower.includes("two") || lower.includes("biweekly") || lower.includes("fortnight")) {
    return 14;
  }
  if (lower.includes("month")) {
    return 30;
  }
  return 7; // Weekly — 7 seconds on Testnet
}
