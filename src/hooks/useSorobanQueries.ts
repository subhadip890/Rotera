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

// ─── Utilities ────────────────────────────────────────────────────────────────

function cadenceToDays(cadence: string): number {
  const lower = cadence.toLowerCase();
  if (lower.includes("two") || lower.includes("biweekly") || lower.includes("fortnight")) {
    return 14;
  }
  if (lower.includes("month")) {
    return 30;
  }
  return 7; // weekly default
}
