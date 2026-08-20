import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useRotera } from "@/store/useRotera";
import { countdown, formatAmount } from "@/lib/rotera";
import {
  useCircleState,
  useUserCircles,
  useCircleMemberNames,
  useContributeMutation,
  useCloseCycleMutation,
  useWithdrawDepositMutation,
  useRepayDebtMutation,
  stroopsToXlm,
} from "@/hooks/useSorobanQueries";
import { upsertCircleMemberName } from "@/lib/supabase";

export const Route = createFileRoute("/circle")({
  head: () => ({
    meta: [
      { title: "Your circle | Rotera" },
      {
        name: "description",
        content:
          "Live view of your savings circle: this cycle's contribution, the countdown to cutoff, who has paid, whose turn is next, and one tap to pay your share.",
      },
      { property: "og:title", content: "Your circle | Rotera" },
      {
        property: "og:description",
        content: "Who has paid, who's next, and the countdown to this week's cutoff.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const {
    wallet,
    address,
    activeCircleId: circleId,
    setActiveCircleId,
    lastPayout,
    dismissPayout,
    onboardingDone,
  } = useRotera();

  const { data: userCircles } = useUserCircles(address);

  // Auto-resolve effective circle ID:
  //   1. Zustand-stored activeCircleId (persisted after create/join/navigate)
  //   2. Latest circle from on-chain member list (async query result)
  //   3. null — show "No circles yet" state (do NOT fall back to hardcoded Circle #3)
  //
  // IMPORTANT: effectiveCircleId is the SINGLE source of truth for ALL mutations
  // (contribute, close_cycle, withdraw_deposit, repay_debt). Using any other
  // variable (especially the raw `circleId` from Zustand, which may be null)
  // causes WasmVm InvalidAction because the contract panics on a non-existent circle ID.
  const effectiveCircleId: string | null =
    circleId ||
    (userCircles && userCircles.length > 0
      ? String(userCircles[userCircles.length - 1])
      : null);

  const { data: circle, isLoading, isError } = useCircleState(effectiveCircleId);

  // Real-time member display names from Supabase
  const { data: memberNames } = useCircleMemberNames(effectiveCircleId);
  const namesByAddress = memberNames || new Map<string, string>();

  // Auto-persist effectiveCircleId when valid circle loads
  useEffect(() => {
    if (circle && effectiveCircleId) {
      setActiveCircleId(effectiveCircleId);
    }
  }, [circle, effectiveCircleId, setActiveCircleId]);

  const contributeMutation = useContributeMutation();
  const closeCycleMutation = useCloseCycleMutation();
  const withdrawMutation = useWithdrawDepositMutation();
  const repayDebtMutation = useRepayDebtMutation();

  const [now, setNow] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit own display name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !effectiveCircleId) {
      setNameError("No wallet or active circle connected.");
      return;
    }
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Please enter your display name.");
      return;
    }
    if (trimmed.length > 40) {
      setNameError("Display name must be 40 characters or fewer.");
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      const success = await upsertCircleMemberName(effectiveCircleId, address, trimmed);
      if (!success) {
        setNameError("Could not save name. Check your connection or Supabase config.");
        setIsSavingName(false);
        return;
      }

      // Immediately invalidate and refetch member names query
      await queryClient.invalidateQueries({
        queryKey: ["circleMemberNames", effectiveCircleId],
      });

      setIsSavingName(false);
      setIsEditingName(false);
    } catch (err) {
      console.warn("[Rotera] Failed to save display name:", err);
      setNameError("Unexpected error saving name. Please try again.");
      setIsSavingName(false);
    }
  }

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!effectiveCircleId || (!circle && !isLoading)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Roundtable
          seats={[1, 2, 3, 4, 5, 6].map((n) => ({
            id: String(n),
            name: "",
            status: "waiting" as const,
          }))}
          currentSeat={-1}
          size={300}
          showLabels={false}
          className="mx-auto"
        />
        <h1 className="mt-6 text-3xl font-semibold">No circles yet</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Create a circle or open the invite link someone sent you. Your circle data
          lives on Stellar — connect a wallet to see your circles.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/create"
            className="rounded-md bg-brass px-5 py-3 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
          >
            Start a circle
          </Link>
          <Link
            to="/join"
            className="rounded-md border border-border bg-chalk px-5 py-3 font-medium transition-colors duration-200 hover:bg-parchment"
          >
            Open an invite link
          </Link>
        </div>
        {isError && (
          <p className="mt-6 text-sm text-rust">
            Could not load circle from chain. Check your connection and contract configuration.
          </p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-center">
        <div className="mx-auto h-48 w-48 animate-pulse rounded-full bg-border" />
        <p className="mt-8 text-muted-foreground">Loading circle from Stellar…</p>
      </div>
    );
  }

  if (!circle) return null;

  // Map on-chain members & seats to display format based on exact circle.member_count
  const seats = Array.from({ length: circle.member_count }, (_, i) => {
    if (i < circle.payout_order.length) {
      const addr = circle.payout_order[i] || "";
      const ms = addr ? circle.member_states.get(addr) : undefined;
      const cycleIdx = circle.current_cycle - 1;
      const currentCycleRecord =
        circle.cycles.length > cycleIdx ? circle.cycles[cycleIdx] : null;
      const paid = addr && currentCycleRecord ? (currentCycleRecord.contributions.get(addr) ?? false) : false;
      const isLate = !paid && now !== null && circle.cycle_deadline > 0 && now / 1000 > circle.cycle_deadline;
      const isDefaulted = ms ? ms.missed_cycles > 0 : false;

      const isMe = Boolean(address && addr === address);
      const memberDisplayName = namesByAddress.get(addr);
      const name = isMe ? "You" : (memberDisplayName || truncateAddr(addr));

      return {
        id: addr,
        name,
        address: memberDisplayName || truncateAddr(addr),
        status: paid ? ("paid" as const) : (isLate || isDefaulted) ? ("late" as const) : ("waiting" as const),
        onTime: ms ? (circle.cycles.length - ms.missed_cycles) : 0,
        lateCount: ms?.missed_cycles ?? 0,
        debt: ms?.debt ?? BigInt(0),
      };
    } else {
      return {
        id: `seat-${i}`,
        name: `Seat ${i + 1}`,
        address: `Seat ${i + 1}`,
        status: "waiting" as const,
        onTime: 0,
        lateCount: 0,
        debt: BigInt(0),
      };
    }
  });

  const members = seats.filter((s) => s.id && !s.id.startsWith("seat-"));
  // Guard currentSeat so it never goes negative: only compute when active/completed and current_cycle > 0
  const currentSeat =
    (circle.status === "Active" || circle.status === "Completed") && circle.current_cycle > 0
      ? (circle.current_cycle - 1) % circle.member_count
      : -1;
  const recipient = currentSeat >= 0 ? seats[currentSeat] : null;
  const isMyTurn = Boolean(recipient && recipient.id === address);
  const you = address ? members.find((m) => m.id === address) : null;
  const paidCount = members.filter((m) => m.status === "paid").length;

  const cutoffMs = circle.cycle_deadline * 1000; // convert from seconds
  const contributionXlm = stroopsToXlm(circle.contribution_amount);
  const potXlm = contributionXlm * circle.member_count;

  const cadenceLabel =
    circle.cycle_length_days === 7
      ? "Weekly"
      : circle.cycle_length_days === 14
        ? "Biweekly"
        : circle.cycle_length_days === 30
          ? "Monthly"
          : `${circle.cycle_length_days}-day`;

  async function handlePay() {
    if (wallet !== "connected") {
      setPayError("Your wallet isn't connected. Connect it from the top right, then pay your share.");
      return;
    }
    if (!effectiveCircleId) {
      setPayError("No active circle. Join or create a circle first.");
      return;
    }
    if (circle?.status !== "Active") {
      setPayError("This circle is not active yet. All seats must be filled before payments start.");
      return;
    }
    setPayError(null);
    if (import.meta.env.DEV) {
      console.log(`[Rotera] handlePay → contribute(circle=${effectiveCircleId}, cycle=${circle!.current_cycle})`);
    }
    try {
      await contributeMutation.mutateAsync({
        circleId: effectiveCircleId,
        cycleNumber: circle!.current_cycle,
      });
    } catch (err: any) {
      // Surface the real contract error to help diagnose issues
      const msg = err?.message || "Contribution transaction failed.";
      setPayError(msg);
      if (import.meta.env.DEV) {
        console.error(`[Rotera] contribute failed (circle=${effectiveCircleId}):`, err);
      }
    }
  }

  async function handleCloseCycle() {
    if (wallet !== "connected") {
      setPayError("Connect your wallet to trigger cycle close.");
      return;
    }
    if (!effectiveCircleId) {
      setPayError("No active circle.");
      return;
    }
    setPayError(null);
    if (import.meta.env.DEV) {
      console.log(`[Rotera] handleCloseCycle → close_cycle(circle=${effectiveCircleId}, cycle=${circle!.current_cycle})`);
    }
    try {
      await closeCycleMutation.mutateAsync({
        circleId: effectiveCircleId,
        cycleNumber: circle!.current_cycle,
        recipientName: recipient?.name ?? "Member",
        amountXlm: potXlm,
      });
    } catch (err: any) {
      setPayError(err?.message || "Keeper close_cycle transaction failed.");
    }
  }

  async function handleWithdrawDeposit() {
    if (wallet !== "connected") return;
    if (!effectiveCircleId) return;
    setPayError(null);
    if (import.meta.env.DEV) {
      console.log(`[Rotera] handleWithdrawDeposit → withdraw_deposit(circle=${effectiveCircleId})`);
    }
    try {
      await withdrawMutation.mutateAsync({ circleId: effectiveCircleId });
    } catch (err: any) {
      setPayError(err?.message || "Deposit withdrawal failed.");
    }
  }

  async function handleRepayDebt(amountStroops: bigint) {
    if (wallet !== "connected") return;
    if (!effectiveCircleId) return;
    setPayError(null);
    if (import.meta.env.DEV) {
      console.log(`[Rotera] handleRepayDebt → repay_debt(circle=${effectiveCircleId}, amount=${amountStroops})`);
    }
    try {
      await repayDebtMutation.mutateAsync({
        circleId: effectiveCircleId,
        amountStroops,
      });
    } catch (err: any) {
      setPayError(err?.message || "Debt repayment transaction failed.");
    }
  }

  const deadlinePassed =
    now !== null && circle.cycle_deadline > 0 && now / 1000 > circle.cycle_deadline;

  return (
    <>
      {!onboardingDone && <Onboarding />}

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
              {circle.status === "Completed"
                ? "Completed"
                : circle.status === "Filling"
                  ? `Filling (${circle.payout_order.length}/${circle.member_count} seats)`
                  : `Cycle ${circle.current_cycle} of ${circle.member_count}`}{" "}
              · {cadenceLabel} · #{circleId}
            </p>
            <h1 className="mt-2 text-4xl font-semibold">{circle.name}</h1>
          </div>
          <Link
            to="/history"
            className="text-verdigris underline underline-offset-4 transition-colors duration-200 hover:text-ink"
          >
            See the full record
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[380px_1fr]">
          <div>
            <Roundtable
              seats={seats}
              currentSeat={currentSeat}
              size={380}
              caption={
                circle.status === "Filling"
                  ? `Waiting for ${circle.member_count - circle.payout_order.length} more member${circle.member_count - circle.payout_order.length === 1 ? "" : "s"} to join`
                  : circle.status === "Completed"
                    ? "Circle completed — all payouts done"
                    : `${isMyTurn ? "It's your turn — you receive" : `${recipient?.name ?? "The recipient"} receives`} ${formatAmount(potXlm)} XLM this cycle`
              }
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Your share" value={`${formatAmount(contributionXlm)} XLM`} />
              <Stat
                label={
                  circle.status === "Filling"
                    ? "Status"
                    : deadlinePassed
                      ? "Deadline passed"
                      : "Cutoff in"
                }
                value={
                  circle.status === "Filling"
                    ? "Waiting for seats"
                    : deadlinePassed
                      ? "Pending close"
                      : now === null || circle.cycle_deadline === 0
                        ? "—"
                        : countdown(cutoffMs, now)
                }
              />
              <Stat
                label={circle.status === "Filling" ? "Seats filled" : "Paid so far"}
                value={
                  circle.status === "Filling"
                    ? `${circle.payout_order.length} of ${circle.member_count}`
                    : `${paidCount} of ${members.length}`
                }
              />
            </div>

            {/* Pay / Close / Withdraw / Filling panel */}
            <div className="rounded-xl border border-border bg-chalk p-5">
              {circle.status === "Filling" ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-brass animate-pulse" />
                    <p className="font-semibold text-ink">Waiting for members</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Waiting for{" "}
                    <strong className="text-ink">
                      {circle.member_count - circle.payout_order.length} more member
                      {circle.member_count - circle.payout_order.length === 1 ? "" : "s"}
                    </strong>{" "}
                    to join before the first cycle starts. Once all {circle.member_count} seats are filled,
                    the circle will activate automatically on Stellar.
                  </p>

                  {/* Invite link sharing */}
                  <div className="mt-4 rounded-lg border border-border bg-parchment/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Share Invite Link
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${effectiveCircleId}`}
                        className="flex-1 rounded-md border border-border bg-chalk px-3 py-2 text-xs font-mono text-muted-foreground select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined") {
                            const url = `${window.location.origin}/join/${effectiveCircleId}`;
                            navigator.clipboard.writeText(url).catch(() => {});
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }
                        }}
                        className="rounded-md bg-brass px-4 py-2 text-xs font-semibold text-ink transition-opacity hover:opacity-90 shrink-0"
                      >
                        {copied ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : circle.status === "Completed" ? (
                <div>
                  <p className="font-medium text-verdigris">
                    This circle has completed all {circle.member_count} cycles.
                  </p>
                  {you && you.debt === BigInt(0) && !circle.member_states.get(address || "")?.deposit_withdrawn && (
                    <>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You can withdraw your {stroopsToXlm(circle.deposit_amount)} XLM deposit.
                      </p>
                      <button
                        onClick={() => void handleWithdrawDeposit()}
                        disabled={withdrawMutation.isPending}
                        className="mt-4 rounded-md bg-brass px-5 py-3 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                      >
                        {withdrawMutation.isPending ? "Processing…" : "Withdraw deposit"}
                      </button>
                    </>
                  )}
                  {you && you.debt > BigInt(0) && (
                    <div className="mt-3 rounded-md border border-rust/30 bg-rust/5 p-4">
                      <p className="text-sm font-medium text-rust">
                        You have {stroopsToXlm(you.debt)} XLM in outstanding debt
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your deposit is withheld until this debt is cleared. Repay on-chain to release your {stroopsToXlm(circle.deposit_amount)} XLM deposit.
                      </p>
                      <button
                        onClick={() => void handleRepayDebt(you.debt)}
                        disabled={repayDebtMutation.isPending || wallet !== "connected"}
                        className="mt-3 rounded-md bg-rust px-4 py-2 text-sm font-semibold text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                      >
                        {repayDebtMutation.isPending
                          ? "Approving in wallet…"
                          : `Repay ${stroopsToXlm(you.debt)} XLM debt`}
                      </button>
                    </div>
                  )}
                </div>
              ) : deadlinePassed ? (
                <div>
                  <p className="font-medium">
                    The cutoff has passed — ready to close cycle {circle.current_cycle}.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Any wallet can trigger this. Based on {paidCount} of {members.length} members
                    who have contributed, the contract will transfer approximately{" "}
                    <strong>{formatAmount(paidCount * contributionXlm)} XLM</strong> to {recipient?.name ?? "the recipient"}.
                    The final amount is settled on-chain when close_cycle executes.
                  </p>
                  <button
                    onClick={() => void handleCloseCycle()}
                    disabled={closeCycleMutation.isPending}
                    className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment disabled:opacity-60"
                  >
                    {closeCycleMutation.isPending
                      ? "Executing close_cycle on Stellar…"
                      : `Close cycle and pay out ${recipient?.name ?? "the recipient"}`}
                  </button>
                </div>
              ) : you?.status === "paid" ? (
                <div>
                  <p className="font-medium text-verdigris">
                    Your {formatAmount(contributionXlm)} XLM is in for this cycle.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nothing else to do until {isMyTurn ? "you are" : `${recipient?.name ?? "the recipient"} is`} paid out and the ring turns.
                  </p>
                  {deadlinePassed && (
                    <button
                      onClick={() => void handleCloseCycle()}
                      disabled={closeCycleMutation.isPending}
                      className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment disabled:opacity-60"
                    >
                      {closeCycleMutation.isPending
                        ? "Executing Soroban keeper close_cycle…"
                        : `Close cycle and pay out ${recipient?.name ?? "the recipient"}`}
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {formatAmount(contributionXlm)} XLM due before the cutoff
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isMyTurn
                      ? "It goes into your own payout this cycle — the contract holds it until close."
                      : `Goes straight to ${recipient?.name ?? "the recipient"}'s payout when the cycle closes.`}
                  </p>
                  <button
                    onClick={() => void handlePay()}
                    disabled={contributeMutation.isPending || wallet !== "connected"}
                    className="mt-4 w-full rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 sm:w-auto"
                  >
                    {contributeMutation.isPending
                      ? "Approve it in your wallet…"
                      : "Pay my share"}
                  </button>
                  {wallet !== "connected" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Connect your wallet to pay.
                    </p>
                  )}
                </div>
              )}

              {payError && (
                <p
                  role="alert"
                  className="mt-3 rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust"
                >
                  {payError}
                </p>
              )}
            </div>

            {/* Member list */}
            <div className="overflow-hidden rounded-xl border border-border bg-chalk">
              <h2 className="border-b border-border px-5 py-3.5 text-sm font-semibold">
                {circle.status === "Filling" ? "Joined members" : "This cycle"}
              </h2>
              <ul>
                {members.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-0"
                  >
                    <span className="num w-7 text-sm text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{m.name}</span>
                    {namesByAddress.get(m.id) && m.id === address && (
                      <span className="text-xs text-muted-foreground font-normal">
                        ({namesByAddress.get(m.id)})
                      </span>
                    )}
                    {m.id === address && (
                      <span className="rounded-full bg-verdigris/10 px-2 py-0.5 text-xs text-verdigris">
                        you
                      </span>
                    )}
                    {m.id === address && (
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(namesByAddress.get(address) || "");
                          setNameError(null);
                          setIsEditingName(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-chalk px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brass hover:text-ink"
                        title="Edit your display name"
                        aria-label="Edit your display name"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-2.5"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        <span>{namesByAddress.has(address) ? "Edit name" : "Set name"}</span>
                      </button>
                    )}
                    {i === currentSeat && currentSeat >= 0 && (
                      <span className="rounded-full bg-brass/20 px-2 py-0.5 text-xs font-medium text-ink">
                        their turn
                      </span>
                    )}
                    {m.debt > BigInt(0) && (
                      <span className="text-xs text-rust">
                        {stroopsToXlm(m.debt)} XLM debt
                      </span>
                    )}
                    <StatusPill status={m.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {isEditingName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
            onClick={() => setIsEditingName(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-name-title"
              className="w-full max-w-md rounded-2xl border border-brass/60 bg-chalk p-6 text-left shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 id="edit-name-title" className="text-xl font-semibold">
                  {namesByAddress.has(address || "") ? "Update your name" : "Set your display name"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-ink"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                This name will be shown to other members of this circle on the rotation ring and payout record.
              </p>

              <form onSubmit={handleSaveName} className="mt-5">
                <label
                  htmlFor="user-display-name-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Display name
                </label>
                <input
                  id="user-display-name-input"
                  type="text"
                  required
                  maxLength={40}
                  autoFocus
                  placeholder="e.g. Alex, Sarah M., Subhadip"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  className="mt-2 w-full rounded-md border border-border bg-chalk px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted-foreground/60 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                  disabled={isSavingName}
                />
                <p className="mt-1 text-xs text-muted-foreground">1–40 characters.</p>

                {nameError && (
                  <p role="alert" className="mt-3 rounded-md border border-rust/40 bg-rust/10 p-2.5 text-xs text-rust">
                    {nameError}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                    className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-parchment disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="rounded-md bg-brass px-5 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isSavingName ? "Saving…" : "Save name"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout modal */}
      <AnimatePresence>
        {lastPayout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.94, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl border border-brass/60 bg-chalk p-8 text-center"
            >
              <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
                Cycle {lastPayout.cycle} closed
              </p>
              <p className="mt-5 font-display text-5xl font-light text-brass">
                <span className="num">{formatAmount(lastPayout.amount)}</span>
              </p>
              <p className="num mt-1 text-sm text-muted-foreground">XLM</p>
              <h2 className="mt-5 text-2xl font-semibold">
                {lastPayout.recipient} received this cycle's payout
              </h2>
              <p className="mt-2 text-muted-foreground">
                The ring has turned. Funds moved on Stellar — check the history for the transaction.
              </p>
              <button
                onClick={dismissPayout}
                className="mt-6 rounded-md bg-ink px-5 py-3 font-medium text-chalk transition-opacity duration-200 hover:opacity-90"
              >
                Back to the circle
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-chalk p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "paid" | "waiting" | "late" }) {
  const map = {
    paid: ["Paid", "bg-verdigris/15 text-verdigris"],
    waiting: ["Waiting", "bg-muted text-muted-foreground"],
    late: ["Late", "bg-rust/15 text-rust"],
  } as const;
  const [text, cls] = map[status];
  return (
    <span className={`ml-auto rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

function truncateAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
