/**
 * useSorobanQueries.ts
 *
 * TanStack Query hooks for Soroban on-chain state and mutations.
 * These are the ONLY source of truth for blockchain data.
 * Zustand is only used for UI state (wallet, onboarding, modals).
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCircleStateOnChain,
  getMemberCirclesOnChain,
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
import { fetchCircleEventsFromSupabase, subscribeCircleEvents } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";
import { useRotera } from "@/store/useRotera";

// Re-export for convenience
export type { OnChainCircle };
export { stroopsToXlm, xlmToStroops };

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Fetch and cache on-chain circle state.
 * Listens to Supabase realtime circle_events for instant invalidation (<1s),
 * with a 15s poll fallback when Supabase is not configured.
 */
export function useCircleState(circleId: string | number | null | undefined) {
  const queryClient = useQueryClient();
  const cid = circleId ? String(circleId) : null;

  useEffect(() => {
    if (!cid || cid === "sunday-six" || cid === "demo") return;

    // Realtime Supabase event listener: invalidates circle state immediately upon on-chain events
    const unsub = subscribeCircleEvents(cid, () => {
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({ queryKey: ["supabaseCircleEvents", cid] });
    });

    return () => unsub();
  }, [cid, queryClient]);

  return useQuery({
    queryKey: ["circle", cid],
    queryFn: () => getCircleStateOnChain(circleId!),
    enabled: !!cid && cid !== "sunday-six" && cid !== "demo",
    refetchInterval: 15_000, // poll every 15s as fallback
    staleTime: 8_000,
    retry: 2,
  });
}

/**
 * Fetch on-chain member circle IDs for a wallet address.
 */
export function useUserCircles(userAddress: string | null | undefined) {
  return useQuery({
    queryKey: ["userCircles", userAddress],
    queryFn: () => getMemberCirclesOnChain(userAddress!),
    enabled: !!userAddress,
    staleTime: 15_000,
  });
}

const CURRENT_CONTRACT_ID = import.meta.env.VITE_SOROBAN_CONTRACT_ID || "";

/**
 * Fetch historical events for a circle from Supabase scoped to the current contract.
 */
export function useSupabaseCircleEvents(
  circleId: string | number | null | undefined,
  contractId: string = CURRENT_CONTRACT_ID,
) {
  return useQuery({
    queryKey: ["supabaseCircleEvents", contractId, String(circleId)],
    queryFn: () => fetchCircleEventsFromSupabase(circleId, contractId),
    staleTime: 5_000,
    enabled: Boolean(circleId),
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
      amount: number; // XLM display value
      cadence: string;
      memberCount: number;
      payoutOrderType?: "Manual" | "RandomPending";
    }) =>
      submitCreateCircle({
        name: params.name,
        contributionAmount: xlmToStroops(params.amount),
        // testCycleDuration() returns the exact seconds sent to the current Testnet
        // contract (value <= 3600, seconds branch). Never send production day values
        // to this contract — see TIMING ARCHITECTURE note in this file.
        cycleLengthDays: testCycleDuration(params.cadence),
        memberCount: params.memberCount,
        payoutOrderType: params.payoutOrderType || "Manual",
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["circle", data.circleId] });
      queryClient.invalidateQueries({ queryKey: ["userCircles"] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, data.circleId],
      });
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
    mutationFn: ({ circleId }: { circleId: string | number }) => submitJoinCircle(circleId),
    onSuccess: (_, variables) => {
      const cid = String(variables.circleId);
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({ queryKey: ["userCircles"] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, cid],
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
    mutationFn: ({ circleId, cycleNumber }: { circleId: string | number; cycleNumber: number }) =>
      submitContribute(circleId, cycleNumber),
    onSuccess: (_, variables) => {
      const cid = String(variables.circleId);
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, cid],
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
      const cid = String(variables.circleId);
      // Show the payout toast using UI-only state
      if (variables.recipientName && variables.amountXlm !== undefined) {
        setLastPayout({
          recipient: variables.recipientName,
          amount: variables.amountXlm,
          cycle: variables.cycleNumber,
        });
      }
      // Refresh chain state & events
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({ queryKey: ["userCircles"] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, cid],
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
    mutationFn: ({ circleId }: { circleId: string | number }) => submitWithdrawDeposit(circleId),
    onSuccess: (_, variables) => {
      const cid = String(variables.circleId);
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, cid],
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
      const cid = String(variables.circleId);
      queryClient.invalidateQueries({ queryKey: ["circle", cid] });
      queryClient.invalidateQueries({
        queryKey: ["supabaseCircleEvents", CURRENT_CONTRACT_ID, cid],
      });
    },
    onError: (err) => {
      captureException(err, { context: "useRepayDebtMutation" });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMING ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════
//
// The Green Belt Testnet contract (CDPLF2WY4NH57MYABBKLSPOJZVAMBFM5N2F5P7SPXS4KF2L6MRPMQ7TJ, legacy: CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4)
// uses this dual-mode calculate_deadline(cycle_length_days: u32):
//
//   value <= 3600  →  deadline = now + value           (interprets as SECONDS)
//   value >  3600  →  deadline = now + value × 86400   (interprets as DAYS)
//
// CRITICAL CONSEQUENCE:
//   - 7   →  7  <= 3600  →  deadline = now + 7s        (NOT 7 days)
//   - 14  →  14 <= 3600  →  deadline = now + 14s       (NOT 14 days)
//   - 30  →  30 <= 3600  →  deadline = now + 30s       (NOT 30 days)
//
// THERE IS NO WAY to express 7-day/14-day/30-day cycles on the current contract:
//   - send 7  → 7 seconds
//   - send 3601 → 3601 × 86400 = 311,126,400 s ≈ 9.8 years  (wrong)
//   - send 7 (as days) → 7 × 86400 = 604800 > 3600 → 604800 × 86400 ≈ 1656 years (wrong)
//
// SOLUTION: The frontend for the current Testnet deployment ONLY sends
// explicit second values <= 3600 (accelerated test mode). The UI never
// falsely labels them as Weekly/Biweekly/Monthly.
//
// PRODUCTION / MAINNET: A redeployed contract must use:
//   cycle_duration_seconds: u64  (unambiguous, no dual-mode branch)
// With that contract the frontend sends 604800/1209600/2592000 directly.

/**
 * Production cadence durations in seconds — for documentation and future mainnet use.
 * These values CANNOT be used with the current Testnet contract without giving
 * wildly wrong deadlines (see timing architecture note above).
 */
export const PRODUCTION_CADENCES_SECONDS = {
  /** 7 × 86400 = 604,800 seconds */
  weekly: 7 * 86400,
  /** 14 × 86400 = 1,209,600 seconds */
  biweekly: 14 * 86400,
  /** 30 × 86400 = 2,592,000 seconds */
  monthly: 30 * 86400,
} as const;

/**
 * Convert a production cadence label to its correct duration in seconds.
 * FOR DOCUMENTATION / MAINNET USE ONLY.
 *
 * ⚠️  Do NOT pass these values to the current Testnet contract.
 *     The current contract's dual-mode branch would multiply them by 86400
 *     again, producing deadlines thousands of years in the future.
 *
 * With a mainnet contract using `cycle_duration_seconds: u64`, pass these
 * values directly: 604800, 1209600, or 2592000.
 */
export function productionCadenceSeconds(cadence: "weekly" | "biweekly" | "monthly"): number {
  return PRODUCTION_CADENCES_SECONDS[cadence];
}

/**
 * Convert an accelerated test cycle label to the value sent to the current
 * Testnet contract. All values are <= 3600, triggering the seconds branch:
 *   deadline = ledger_timestamp + returned_value
 *
 * These are the ONLY safe values for the current deployed Testnet contract.
 * They intentionally create short cycles for Green Belt demo / review.
 *
 * @param label - One of: "10s", "30s", "60s", "5min"
 * @returns Exact seconds to add to the current ledger timestamp
 */
export function testCycleDuration(label: string): number {
  const lower = label.toLowerCase();
  if (lower === "10s" || lower === "10 seconds" || lower === "10-second test cycle") return 10;
  if (lower === "30s" || lower === "30 seconds" || lower === "30-second test cycle") return 30;
  if (lower === "60s" || lower === "1 minute" || lower === "60-second test cycle") return 60;
  if (lower === "5min" || lower === "5 minutes" || lower === "5-minute test cycle") return 300;
  // Default to 30s for any unrecognised test label
  console.warn(`[testCycleDuration] Unrecognised label "${label}" — defaulting to 30 seconds`);
  return 30;
}

/**
 * @deprecated Use testCycleDuration() for the current Testnet contract.
 * Kept for backward compatibility — maps old cadence strings to test durations.
 */
export function cadenceToDays(cadence: string): number {
  return testCycleDuration(cadence);
}
