import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { useRotera } from "@/store/useRotera";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a circle — Rotera" },
      {
        name: "description",
        content:
          "Claim your seat in a savings circle: see the contribution, the schedule, your position in the rotation and exactly what you're agreeing to before you join.",
      },
      { property: "og:title", content: "Join a circle — Rotera" },
      {
        property: "og:description",
        content: "See your seat and the full agreement before you commit.",
      },
    ],
  }),
  component: JoinCircle,
});

const SEATS = [
  { id: "1", name: "Priya", status: "waiting" as const },
  { id: "2", name: "Tunde", status: "waiting" as const },
  { id: "3", name: "Mariela", status: "waiting" as const },
  { id: "4", name: "You", status: "waiting" as const },
  { id: "5", name: "Samir", status: "waiting" as const },
  { id: "6", name: "Nomsa", status: "waiting" as const },
];

function JoinCircle() {
  const navigate = useNavigate();
  const { wallet, connect, loadDemoCircle } = useRotera();
  const connected = wallet === "connected";

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-12 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
          Invite · sunday-six-4f2a
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Priya invited you to Sunday Six</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Six people, six weeks, one turn each. Read the agreement below — after you
          join, none of it can change.
        </p>

        <h2 className="mt-10 text-xl font-semibold">What you're agreeing to</h2>
        <ul className="mt-4 space-y-3">
          {[
            "You pay 200 XLM every Sunday before 8pm, for six weeks.",
            "You are seat 4. You receive the full pot of 1,200 XLM in week 4.",
            "If you pay after the cutoff, the circle records it as late and everyone sees it.",
            "You can't leave once the first payout has gone out — your seat stays in the rotation.",
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-verdigris" />
              <span className="text-muted-foreground">{t}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-xl border border-border bg-chalk p-5">
          {connected ? (
            <>
              <p className="font-medium">Wallet connected — seat 4 is held for you.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Joining costs nothing. Your first 200 XLM is due at the next cutoff.
              </p>
              <button
                onClick={() => {
                  loadDemoCircle();
                  void navigate({ to: "/circle" });
                }}
                className="mt-4 rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
              >
                Take seat 4
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">Connect a wallet to claim your seat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Freighter, Albedo and xBull all work. Nothing leaves your wallet until
                you approve a payment.
              </p>
              <button
                onClick={() => void connect()}
                disabled={wallet === "connecting"}
                className="mt-4 rounded-md bg-ink px-6 py-3.5 font-semibold text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
              >
                {wallet === "connecting" ? "Waiting for Freighter…" : "Connect wallet"}
              </button>
              <p className="mt-3 text-sm text-muted-foreground">
                No wallet yet?{" "}
                <Link to="/" className="text-verdigris underline underline-offset-4">
                  Read how wallets work first
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Roundtable
          seats={SEATS}
          currentSeat={3}
          size={380}
          caption="Your seat is highlighted in brass"
        />
      </aside>
    </div>
  );
}
