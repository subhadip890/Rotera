import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCircleState,
  submitCreateCircleOnChain,
  submitJoinCircleOnChain,
  submitContributeOnChain,
  submitCloseCycleOnChain,
} from "@/lib/soroban";
import { useRotera } from "@/store/useRotera";
import { captureException } from "@/lib/sentry";

export function useCircleState(circleId: string = "sunday-six") {
  return useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => getCircleState(circleId),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useCreateCircleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      amount: number;
      cadence: string;
      members: string[];
    }) => submitCreateCircleOnChain(params),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["circle"] });
    },
    onError: (err) => {
      captureException(err, { context: "useCreateCircleMutation" });
    },
  });
}

export function useJoinCircleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      circleId,
      userAddress,
    }: {
      circleId: string;
      userAddress: string;
    }) => submitJoinCircleOnChain(circleId, userAddress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
    },
    onError: (err) => {
      captureException(err, { context: "useJoinCircleMutation" });
    },
  });
}

export function useContributeMutation() {
  const queryClient = useQueryClient();
  const { payShare } = useRotera();

  return useMutation({
    mutationFn: ({
      circleId,
      amount,
      cycleNumber,
    }: {
      circleId: string;
      amount: number;
      cycleNumber: number;
    }) => submitContributeOnChain(circleId, amount, cycleNumber),
    onSuccess: (_, variables) => {
      payShare();
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
    },
    onError: (err) => {
      captureException(err, { context: "useContributeMutation" });
    },
  });
}

export function useCloseCycleMutation() {
  const queryClient = useQueryClient();
  const { closeCycle } = useRotera();

  return useMutation({
    mutationFn: ({
      circleId,
      cycleNumber,
      recipientName,
      amountPaidOut,
    }: {
      circleId: string;
      cycleNumber: number;
      recipientName: string;
      amountPaidOut: number;
    }) =>
      submitCloseCycleOnChain(
        circleId,
        cycleNumber,
        recipientName,
        amountPaidOut,
      ),
    onSuccess: (_, variables) => {
      closeCycle();
      queryClient.invalidateQueries({ queryKey: ["circle", variables.circleId] });
    },
    onError: (err) => {
      captureException(err, { context: "useCloseCycleMutation" });
    },
  });
}
