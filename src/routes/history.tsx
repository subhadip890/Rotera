
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatAmount } from "@/lib/rotera";
import { useCircleState, stroopsToXlm } from "@/hooks/useSorobanQueries";
import { useRotera } from "@/store/useRotera";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Circle history — Rotera" },
      {
        name: "description",
        content:
          "The rotation unrolled: who received each pot, when it went out, and how reliably every member has paid their share.",
      },
      { property: "og:title", content: "Circle history — Rotera" },
      {
        property: "og:description",
        content: "Every payout and every member's contribution record, in order.",
      },
    ],
  }),
  component: History,
});

function History() {
  const { activeCircleId: circleId } = useRotera();
  const { data: circle, isLoading, isError } = useCircleState(circleId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-muted-foreground">Loading history from Stellar…</p>
      </div>
    );
  }

  if (!circle && !isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-semibold">Nothing to show yet</h1>
        <p className="mt-3 text-muted-foreground">
          Once a circle has closed its first cycle, every payout shows up here in order.
        </p>
        {isError && (
          <p className="mt-3 text-sm text-rust">
            Could not connect to the contract. Check your environment configuration.
          </p>
        )}
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
      </div>
    );
  }

  if (!circle) return null;

  const contributionXlm = stroopsToXlm(circle.contribution_amount);

  // Map members to display format
  const members = circle.payout_order.map((addr) => {
    const ms = circle.member_states.get(addr);
    const onTimeCycles = circle.cycles.filter((c) => {
      return c.contributions.get(addr) === true;
    }).length;
    return {
      addr,
      name: truncateAddr(addr),
      onTime: onTimeCycles,
      lateCount: ms?.missed_cycles ?? 0,
      debt: ms?.debt ?? BigInt(0),
      receivedPayout: ms?.has_received_payout ?? false,
    };
  });

  // Closed cycles = history
  const closedCycles = circle.cycles.filter((c) => c.closed);

  const cadenceLabel =
    circle.cycle_length_days === 7
      ? "Weekly"
      : circle.cycle_length_days === 14
        ? "Biweekly"
        : circle.cycle_length_days === 30
          ? "Monthly"
          : `${circle.cycle_length_days}-day`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-4xl font-semibold">{circle.name} — the record</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        The same ring, unrolled. {circle.member_count} members · {cadenceLabel} ·{" "}
        {circle.payout_order_type === "RandomPending"
          ? "Random order (shuffled at activation from ledger hash)"
          : "Manual join order"}
        .
      </p>

      {/* Unrolled ring timeline */}
      <ol className="mt-10 flex gap-0 overflow-x-auto pb-2">
        {circle.payout_order.map((addr, i) => {
          const done = i < circle.current_cycle - 1;
          const current = i === circle.current_cycle - 1;
          const name = truncateAddr(addr);
          return (
            <li key={addr} className="flex min-w-24 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={`h-px flex-1 ${i === 0 ? "bg-transparent" : done || current ? "bg-verdigris" : "bg-border"}`}
                />
                <span
                  className={`size-4 rounded-full border-2 ${
                    current
                      ? "border-brass bg-brass"
                      : done
                        ? "border-verdigris bg-verdigris"
                        : "border-border bg-chalk"
                  }`}
                />
                <span
                  className={`h-px flex-1 ${i === circle.payout_order.length - 1 ? "bg-transparent" : done ? "bg-verdigris" : "bg-border"}`}
                />
              </div>
              <span className="num mt-2 text-xs text-muted-foreground">
                Cycle {i + 1}
              </span>
              <span className={`text-sm ${current ? "font-semibold" : ""}`}>{name}</span>
            </li>
          );
        })}
      </ol>

      {/* Payout history from chain */}
      <h2 className="mt-14 text-2xl font-semibold">Payouts</h2>
      {closedCycles.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No cycles have closed yet. Payouts will appear here after each cycle closes.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-chalk">
          {closedCycles.map((c) => {
            const amountXlm = stroopsToXlm(c.amount_paid_out);
            const dateStr =
              c.closed_at > 0
                ? new Date(c.closed_at * 1000).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—";
            const paidCount = Array.from(c.contributions.values()).filter(Boolean).length;
            const missedCount = circle.member_count - paidCount;

            return (
              <li
                key={c.cycle_number}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4"
              >
                <span className="num w-16 text-sm text-muted-foreground">
                  Cycle {c.cycle_number}
                </span>
                <span className="font-medium">{truncateAddr(c.recipient)}</span>
                <span className="num ml-auto text-lg">{formatAmount(amountXlm)} XLM</span>
                <span className="num w-28 text-right text-sm text-muted-foreground">
                  {dateStr}
                </span>
                {missedCount > 0 && (
                  <p className="w-full text-sm text-rust">
                    {missedCount} member{missedCount > 1 ? "s" : ""} missed — pot reduced by{" "}
                    {formatAmount(missedCount * contributionXlm)} XLM.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Member reliability table */}
      <h2 className="mt-14 text-2xl font-semibold">Who pays on time</h2>
      <table className="mt-4 w-full overflow-hidden rounded-xl border border-border bg-chalk text-left">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th scope="col" className="px-5 py-3 font-medium">Member</th>
            <th scope="col" className="px-5 py-3 font-medium">On time</th>
            <th scope="col" className="px-5 py-3 font-medium">Missed</th>
            <th scope="col" className="px-5 py-3 font-medium">Debt</th>
            <th scope="col" className="px-5 py-3 font-medium">Wallet</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.addr} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-3.5 font-medium">{m.name}</td>
              <td className="num px-5 py-3.5">{m.onTime}</td>
              <td
                className={`num px-5 py-3.5 ${m.lateCount > 0 ? "text-rust" : "text-muted-foreground"}`}
              >
                {m.lateCount}
              </td>
              <td className={`num px-5 py-3.5 ${m.debt > BigInt(0) ? "text-rust" : "text-muted-foreground"}`}>
                {m.debt > BigInt(0) ? `${stroopsToXlm(m.debt)} XLM` : "—"}
              </td>
              <td className="num px-5 py-3.5 text-xs text-muted-foreground">
                {truncateAddr(m.addr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Chain info */}
      <div className="mt-8 rounded-xl border border-border bg-chalk p-4 text-sm text-muted-foreground">
        <p>
          All data on this page comes directly from the Stellar Testnet smart contract.
          Circle #{circleId} · contract{" "}
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${import.meta.env.VITE_SOROBAN_CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-verdigris underline underline-offset-2"
          >
            {(import.meta.env.VITE_SOROBAN_CONTRACT_ID || "").slice(0, 8)}…
          </a>
        </p>
      </div>
    </div>
  );
}

function truncateAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
