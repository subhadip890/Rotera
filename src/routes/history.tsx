import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatAmount, formatCycleDuration, truncateAddr } from "@/lib/rotera";
import {
  useCircleState,
  useUserCircles,
  useSupabaseCircleEvents,
  stroopsToXlm,
} from "@/hooks/useSorobanQueries";
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
  const { activeCircleId: storedCircleId, address, setActiveCircleId } = useRotera();
  const { data: userCircles } = useUserCircles(address);

  // Auto-resolve effective circle ID: stored active ID -> latest user circle -> null
  const defaultCircleId =
    storedCircleId ||
    (userCircles && userCircles.length > 0 ? String(userCircles[userCircles.length - 1]) : "");

  const [selectedCircleId, setSelectedCircleId] = useState<string>(defaultCircleId);

  // Keep selectedCircleId in sync when userCircles loads or activeCircleId changes
  useEffect(() => {
    if (storedCircleId) {
      setSelectedCircleId(storedCircleId);
    } else if (userCircles && userCircles.length > 0) {
      setSelectedCircleId(String(userCircles[userCircles.length - 1]));
    }
  }, [storedCircleId, userCircles]);

  const effectiveCircleId = selectedCircleId || defaultCircleId || "";

  // Load state from Stellar Testnet contract (only when effectiveCircleId is set)
  const { data: circle, isLoading, isError } = useCircleState(effectiveCircleId || null);

  // Load event audit log from Supabase
  const { data: supabaseEvents } = useSupabaseCircleEvents(effectiveCircleId || null);

  // Auto-update activeCircleId in store when valid circle is loaded
  useEffect(() => {
    if (circle && effectiveCircleId) {
      setActiveCircleId(effectiveCircleId);
    }
  }, [circle, effectiveCircleId, setActiveCircleId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-muted-foreground">Loading history from Stellar Testnet…</p>
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

        {/* Circle selector when user has multiple circles or wants to test another ID */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <label
            htmlFor="circle-select-empty"
            className="text-sm font-medium text-muted-foreground"
          >
            Select Circle ID:
          </label>
          <select
            id="circle-select-empty"
            value={effectiveCircleId}
            onChange={(e) => setSelectedCircleId(e.target.value)}
            className="input max-w-[140px] text-sm"
          >
            {["1", "2", "3", "4", "5"].map((id) => (
              <option key={id} value={id}>
                Circle #{id}
              </option>
            ))}
          </select>
        </div>

        {isError && (
          <p className="mt-4 text-sm text-rust">
            Could not connect to circle #{effectiveCircleId} on the contract. Check network or try
            another Circle ID.
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

  const cadenceLabel = formatCycleDuration(circle.cycle_length_days);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      {/* Header & Circle Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">{circle.name} — the record</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Circle #{effectiveCircleId} · {circle.member_count} members · {cadenceLabel} ·{" "}
            {circle.payout_order_type === "RandomPending"
              ? "Randomized order (ledger hash)"
              : "Manual join order"}
          </p>
        </div>

        {/* Dropdown to switch between circles */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="circle-select-active"
            className="text-xs font-medium text-muted-foreground"
          >
            Circle:
          </label>
          <select
            id="circle-select-active"
            value={effectiveCircleId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedCircleId(newId);
              setActiveCircleId(newId);
            }}
            className="input max-w-[140px] px-3 py-1.5 text-sm"
          >
            {userCircles && userCircles.length > 0
              ? userCircles.map((id) => (
                  <option key={id} value={String(id)}>
                    Circle #{id}
                  </option>
                ))
              : ["1", "2", "3", "4", "5"].map((id) => (
                  <option key={id} value={id}>
                    Circle #{id}
                  </option>
                ))}
          </select>
        </div>
      </div>

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
              <span className="num mt-2 text-xs text-muted-foreground">Cycle {i + 1}</span>
              <span className={`num text-sm ${current ? "font-semibold" : ""}`}>{name}</span>
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
            const recipientName = truncateAddr(c.recipient);

            return (
              <li
                key={c.cycle_number}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4"
              >
                <span className="num w-16 text-sm text-muted-foreground">
                  Cycle {c.cycle_number}
                </span>
                <span className="num font-medium">{recipientName}</span>
                <span className="num ml-auto text-lg">{formatAmount(amountXlm)} XLM</span>
                <span className="num w-28 text-right text-sm text-muted-foreground">{dateStr}</span>
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
            <th scope="col" className="px-5 py-3 font-medium">
              Member
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              On time
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Missed
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Debt
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Wallet
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.addr} className="border-b border-border/60 last:border-0">
              <td className="num px-5 py-3.5 font-medium">{m.name}</td>
              <td className="num px-5 py-3.5">{m.onTime}</td>
              <td
                className={`num px-5 py-3.5 ${m.lateCount > 0 ? "text-rust" : "text-muted-foreground"}`}
              >
                {m.lateCount}
              </td>
              <td
                className={`num px-5 py-3.5 ${m.debt > BigInt(0) ? "text-rust" : "text-muted-foreground"}`}
              >
                {m.debt > BigInt(0) ? `${stroopsToXlm(m.debt)} XLM` : "—"}
              </td>
              <td className="num px-5 py-3.5 text-xs text-muted-foreground">
                {truncateAddr(m.addr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Supabase Event Audit Log */}
      {supabaseEvents && supabaseEvents.length > 0 && (
        <>
          <h2 className="mt-14 text-2xl font-semibold">Supabase Audit Log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            On-chain circle actions recorded in Supabase database.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-chalk">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Event
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Wallet
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Tx Hash
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {supabaseEvents.map((evt, idx) => (
                  <tr key={evt.id || idx} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3.5 font-medium">
                      <span className="inline-flex items-center rounded-md bg-brass/20 px-2 py-1 text-xs font-semibold text-brass">
                        {evt.event_type.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="num px-5 py-3.5 text-xs text-muted-foreground">
                      {evt.wallet_address ? truncateAddr(evt.wallet_address) : "—"}
                    </td>
                    <td className="num px-5 py-3.5 text-xs">
                      {evt.tx_hash ? (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${evt.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-verdigris underline underline-offset-2"
                        >
                          {evt.tx_hash.slice(0, 8)}…
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="num px-5 py-3.5 text-xs text-muted-foreground">
                      {evt.created_at ? new Date(evt.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Chain info */}
      <div className="mt-8 rounded-xl border border-border bg-chalk p-4 text-sm text-muted-foreground">
        <p>
          All circle state on this page is read live from the Stellar Testnet smart contract. Circle
          #{effectiveCircleId} · contract{" "}
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
