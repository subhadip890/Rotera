import { createFileRoute, Link } from "@tanstack/react-router";
import { useRotera } from "@/store/useRotera";
import { formatAmount } from "@/lib/rotera";

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
  const { circle, loadDemoCircle } = useRotera();

  if (!circle) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-3xl font-semibold">Nothing to show yet</h1>
        <p className="mt-3 text-muted-foreground">
          Once a circle has closed its first cycle, every payout shows up here in order.
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

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-4xl font-semibold">{circle.name} — the record</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        The same ring, unrolled. {circle.seedNote}
      </p>

      {/* unrolled ring */}
      <ol className="mt-10 flex gap-0 overflow-x-auto pb-2">
        {circle.members.map((m, i) => {
          const done = i < circle.currentSeat;
          const current = i === circle.currentSeat;
          return (
            <li key={m.id} className="flex min-w-24 flex-1 flex-col items-center">
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
                  className={`h-px flex-1 ${i === circle.members.length - 1 ? "bg-transparent" : done ? "bg-verdigris" : "bg-border"}`}
                />
              </div>
              <span className="num mt-2 text-xs text-muted-foreground">
                Cycle {i + 1}
              </span>
              <span className={`text-sm ${current ? "font-semibold" : ""}`}>{m.name}</span>
            </li>
          );
        })}
      </ol>

      <h2 className="mt-14 text-2xl font-semibold">Payouts</h2>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-chalk">
        {circle.history.map((h) => (
          <li key={h.cycle} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4">
            <span className="num w-16 text-sm text-muted-foreground">
              Cycle {h.cycle}
            </span>
            <span className="font-medium">{h.recipient}</span>
            <span className="num ml-auto text-lg">{formatAmount(h.amount)} XLM</span>
            <span className="num w-16 text-right text-sm text-muted-foreground">
              {h.date}
            </span>
            {h.note && (
              <p className="w-full text-sm text-muted-foreground">{h.note}</p>
            )}
          </li>
        ))}
      </ul>

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
              Late
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Wallet
            </th>
          </tr>
        </thead>
        <tbody>
          {circle.members.map((m) => (
            <tr key={m.id} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-3.5 font-medium">{m.name}</td>
              <td className="num px-5 py-3.5">{m.onTime}</td>
              <td
                className={`num px-5 py-3.5 ${m.lateCount > 0 ? "text-rust" : "text-muted-foreground"}`}
              >
                {m.lateCount}
              </td>
              <td className="num px-5 py-3.5 text-sm text-muted-foreground">
                {m.address}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
