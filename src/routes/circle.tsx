import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { useRotera } from "@/store/useRotera";
import { countdown, formatAmount, potTotal, YOU_ID } from "@/lib/rotera";

export const Route = createFileRoute("/circle")({
  head: () => ({
    meta: [
      { title: "Sunday Six — your circle | Rotera" },
      {
        name: "description",
        content:
          "Live view of your savings circle: this cycle's contribution, the countdown to cutoff, who has paid, whose turn is next, and one tap to pay your share.",
      },
      { property: "og:title", content: "Sunday Six — your circle | Rotera" },
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
    circle,
    wallet,
    loadDemoCircle,
    payShare,
    closeCycle,
    lastPayout,
    dismissPayout,
    onboardingDone,
  } = useRotera();
  const [now, setNow] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!circle) {
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
          Create one for a group you already save with, or paste an invite link someone
          sent you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/create"
            className="rounded-md bg-brass px-5 py-3 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
          >
            Start a circle
          </Link>
          <button
            onClick={loadDemoCircle}
            className="rounded-md border border-border bg-chalk px-5 py-3 font-medium transition-colors duration-200 hover:bg-parchment"
          >
            Open the Sunday Six demo
          </button>
        </div>
      </div>
    );
  }

  const you = circle.members.find((m) => m.id === YOU_ID);
  const recipient = circle.members[circle.currentSeat];
  const yourTurn = recipient?.id === YOU_ID;
  const recipientLabel = yourTurn ? "you" : (recipient?.name ?? "the next seat");
  const paidCount = circle.members.filter((m) => m.status === "paid").length;
  const seats = circle.members.map((m) => ({
    id: m.id,
    name: m.name,
    status: m.status,
  }));

  async function handlePay() {
    if (wallet !== "connected") {
      setPayError(
        "Your wallet isn't connected. Connect it from the top right, then pay your share.",
      );
      return;
    }
    setPayError(null);
    setPaying(true);
    await new Promise((r) => setTimeout(r, 900));
    setPaying(false);
    payShare();
  }

  return (
    <>
      {!onboardingDone && <Onboarding />}

      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
              Cycle {circle.currentCycle} of {circle.members.length} · {circle.cadence}
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
              currentSeat={circle.currentSeat}
              size={380}
              caption={`${yourTurn ? "It's your turn — you receive" : `${recipient?.name} receives`} ${formatAmount(potTotal(circle))} XLM this cycle`}
            />
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Your share" value={`${formatAmount(circle.amount)} XLM`} />
              <Stat
                label="Cutoff in"
                value={now === null ? "—" : countdown(circle.cutoff, now)}
              />
              <Stat label="Paid so far" value={`${paidCount} of ${circle.members.length}`} />
            </div>

            <div className="rounded-xl border border-border bg-chalk p-5">
              {you?.status === "paid" ? (
                <div>
                  <p className="font-medium text-verdigris">
                    Your 200 XLM is in for this cycle.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nothing else to do until {recipientLabel} {yourTurn ? "are" : "is"}{" "}
                    paid out and the ring turns.
                  </p>
                  <button
                    onClick={closeCycle}
                    className="mt-4 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-parchment"
                  >
                    Simulate cutoff and pay out {recipientLabel}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-medium">
                    {formatAmount(circle.amount)} XLM due before the cutoff
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {yourTurn
                      ? "It goes into your own payout this cycle — Rotera never holds it."
                      : `Goes straight to ${recipient?.name}'s payout — Rotera never holds it.`}
                  </p>
                  <button
                    onClick={() => void handlePay()}
                    disabled={paying}
                    className="mt-4 w-full rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 sm:w-auto"
                  >
                    {paying ? "Approve it in your wallet…" : "Pay my share"}
                  </button>
                  {payError && (
                    <p
                      role="alert"
                      className="mt-3 rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust"
                    >
                      {payError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-chalk">
              <h2 className="border-b border-border px-5 py-3.5 text-sm font-semibold">
                This cycle
              </h2>
              <ul>
                {circle.members.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5 last:border-0"
                  >
                    <span className="num w-7 text-sm text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium">{m.name}</span>
                    {i === circle.currentSeat && (
                      <span className="rounded-full bg-brass/20 px-2 py-0.5 text-xs font-medium text-ink">
                        their turn
                      </span>
                    )}
                    <span className="num ml-auto text-sm text-muted-foreground">
                      {m.address}
                    </span>
                    <StatusPill status={m.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

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
                {lastPayout.recipient} received this week's payout
              </h2>
              <p className="mt-2 text-muted-foreground">
                The ring has turned. Next up is{" "}
                {circle.members[circle.currentSeat]?.name}.
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
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{text}</span>
  );
}
