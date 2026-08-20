import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useRotera } from "@/store/useRotera";
import { countdown, formatAmount } from "@/lib/rotera";
import {
  useCircleState,
  useContributeMutation,
  useCloseCycleMutation,
  useWithdrawDepositMutation,
  useRepayDebtMutation,
  stroopsToXlm,
} from "@/hooks/useSorobanQueries";

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
  const {
    wallet,
    address,
    activeCircleId: circleId,
    lastPayout,
    dismissPayout,
    onboardingDone,
  } = useRotera();

  const { data: circle, isLoading, isError } = useCircleState(circleId);

  const contributeMutation = useContributeMutation();
  const closeCycleMutation = useCloseCycleMutation();
  const withdrawMutation = useWithdrawDepositMutation();
  const repayDebtMutation = useRepayDebtMutation();

  const [now, setNow] = useState<number | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!circleId || (!circle && !isLoading)) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Roundtable
          seats={[1, 2, 3, 4, 5, 6].map((n) => ({
            id: String(n),
            name: "",
            status: "waiting" as const,
          }))}
          currentSeat={0}
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
      const name = isMe ? "You" : truncateAddr(addr);

      return {
        id: addr,
        name,
        address: truncateAddr(addr),
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
  const currentSeat = (circle.current_cycle - 1) % circle.member_count;
  const recipient = seats[currentSeat];
  const isMyTurn = recipient?.id === address;
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
    setPayError(null);
    try {
      await contributeMutation.mutateAsync({
        circleId: circleId!,
        cycleNumber: circle!.current_cycle,
      });
    } catch (err: any) {
      setPayError(err?.message || "Contribution transaction failed.");
    }
  }

  async function handleCloseCycle() {
    if (wallet !== "connected") {
      setPayError("Connect your wallet to trigger cycle close.");
      return;
    }
    setPayError(null);
    try {
      await closeCycleMutation.mutateAsync({
        circleId: circleId!,
        cycleNumber: circle!.current_cycle,
        recipientName: recipient?.name || "Member",
        amountXlm: potXlm,
      });
    } catch (err: any) {
      setPayError(err?.message || "Keeper close_cycle transaction failed.");
    }
  }

  async function handleWithdrawDeposit() {
    if (wallet !== "connected") return;
    setPayError(null);
    try {
      await withdrawMutation.mutateAsync({ circleId: circleId! });
    } catch (err: any) {
      setPayError(err?.message || "Deposit withdrawal failed.");
    }
  }

  async function handleRepayDebt(amountStroops: bigint) {
    if (wallet !== "connected") return;
    setPayError(null);
    try {
      await repayDebtMutation.mutateAsync({
        circleId: circleId!,
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
                circle.status === "Completed"
                  ? "Circle completed — all payouts done"
                  : `${isMyTurn ? "It's your turn — you receive" : `${recipient?.name} receives`} ${formatAmount(potXlm)} XLM this cycle`
              }
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Your share" value={`${formatAmount(contributionXlm)} XLM`} />
              <Stat
                label={deadlinePassed ? "Deadline passed" : "Cutoff in"}
                value={
                  deadlinePassed
                    ? "Pending close"
                    : now === null || circle.cycle_deadline === 0
                      ? "—"
                      : countdown(cutoffMs, now)
                }
              />
              <Stat label="Paid so far" value={`${paidCount} of ${members.length}`} />
            </div>

            {/* Pay / Close / Withdraw panel */}
            <div className="rounded-xl border border-border bg-chalk p-5">
              {circle.status === "Completed" ? (
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
                    <strong>{formatAmount(paidCount * contributionXlm)} XLM</strong> to {recipient?.name || "the recipient"}.
                    The final amount is settled on-chain when close_cycle executes.
                  </p>
                  <button
                    onClick={() => void handleCloseCycle()}
                    disabled={closeCycleMutation.isPending}
                    className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment disabled:opacity-60"
                  >
                    {closeCycleMutation.isPending
                      ? "Executing close_cycle on Stellar…"
                      : `Close cycle and pay out ${recipient?.name || "recipient"}`}
                  </button>
                </div>
              ) : you?.status === "paid" ? (
                <div>
                  <p className="font-medium text-verdigris">
                    Your {formatAmount(contributionXlm)} XLM is in for this cycle.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nothing else to do until {isMyTurn ? "you are" : `${recipient?.name} is`} paid out and the ring turns.
                  </p>
                  {deadlinePassed && (
                    <button
                      onClick={() => void handleCloseCycle()}
                      disabled={closeCycleMutation.isPending}
                      className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment disabled:opacity-60"
                    >
                      {closeCycleMutation.isPending
                        ? "Executing Soroban keeper close_cycle…"
                        : `Close cycle and pay out ${recipient?.name || "recipient"}`}
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
                      : `Goes straight to ${recipient?.name}'s payout when the cycle closes.`}
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
                This cycle
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
                    {m.id === address && (
                      <span className="rounded-full bg-verdigris/10 px-2 py-0.5 text-xs text-verdigris">
                        you
                      </span>
                    )}
                    {i === currentSeat && (
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
