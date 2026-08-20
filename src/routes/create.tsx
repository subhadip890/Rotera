import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { randomizeOrder } from "@/lib/rotera";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Start a circle — Rotera" },
      {
        name: "description",
        content:
          "Set the contribution, the schedule and the payout order, then send one invite link to your group. The order is locked once the circle is live.",
      },
      { property: "og:title", content: "Start a circle — Rotera" },
      {
        property: "og:description",
        content: "Set the amount, the schedule and a payout order everyone can verify.",
      },
    ],
  }),
  component: CreateCircle,
});

function CreateCircle() {
  const [name, setName] = useState("Sunday Six");
  const [amount, setAmount] = useState("200");
  const [cadence, setCadence] = useState("Weekly");
  const [members, setMembers] = useState<string[]>([
    "Priya",
    "Tunde",
    "Mariela",
    "You",
    "Samir",
    "Nomsa",
  ]);
  const [seed, setSeed] = useState<number | null>(null);
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seats = members.map((m, i) => ({
    id: `${i}-${m}`,
    name: m || `Seat ${i + 1}`,
    status: "waiting" as const,
  }));

  const potPerCycle = (Number(amount) || 0) * members.length;

  function updateMember(i: number, value: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? value : m)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (members.some((m) => !m.trim())) {
      setError("Every seat needs a name. Fill the blank seats or remove them.");
      return;
    }
    if (!Number(amount) || Number(amount) <= 0) {
      setError("Set a contribution above 0 XLM — that's the amount each seat pays.");
      return;
    }
    setError(null);
    setInvite(`rotera.app/join/${name.toLowerCase().replace(/\s+/g, "-")}-4f2a`);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[1fr_400px]">
      <div>
        <h1 className="text-4xl font-semibold">Start a circle</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Write down the agreement your group already made. Once the first person joins,
          the amount, the schedule and the order can't be changed by anyone — including
          you.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Circle name" htmlFor="c-name">
              <input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Contribution per person (XLM)" htmlFor="c-amount">
              <input
                id="c-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input num"
              />
            </Field>
            <Field label="How often" htmlFor="c-cadence">
              <select
                id="c-cadence"
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
                className="input"
              >
                <option>Weekly</option>
                <option>Every two weeks</option>
                <option>Monthly</option>
              </select>
            </Field>
            <Field label="Seats" htmlFor="c-seats">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMembers((m) => m.slice(0, Math.max(2, m.length - 1)))}
                  className="size-11 rounded-md border border-border bg-chalk text-lg transition-colors duration-200 hover:bg-parchment"
                  aria-label="Remove a seat"
                >
                  −
                </button>
                <span id="c-seats" className="num w-10 text-center text-lg">
                  {members.length}
                </span>
                <button
                  type="button"
                  onClick={() => setMembers((m) => [...m, ""])}
                  className="size-11 rounded-md border border-border bg-chalk text-lg transition-colors duration-200 hover:bg-parchment"
                  aria-label="Add a seat"
                >
                  +
                </button>
              </div>
            </Field>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Payout order</h2>
              <button
                type="button"
                onClick={() => {
                  const { order, seed: s } = randomizeOrder(members);
                  setMembers(order);
                  setSeed(s);
                }}
                className="rounded-md border border-verdigris px-3 py-2 text-sm text-verdigris transition-colors duration-200 hover:bg-verdigris hover:text-chalk"
              >
                Randomize for me
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Type the order your group agreed on, or draw it here in front of everyone.
            </p>

            <ol className="mt-4 space-y-2">
              {members.map((m, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="num w-7 text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <input
                    value={m}
                    onChange={(e) => updateMember(i, e.target.value)}
                    placeholder="Name"
                    aria-label={`Seat ${i + 1} name`}
                    className="input flex-1"
                  />
                </li>
              ))}
            </ol>

            {seed !== null && (
              <p className="num mt-3 rounded-md border border-border bg-chalk p-3 text-xs text-muted-foreground">
                Drawn with a Fisher-Yates shuffle from seed {seed}. Re-run it as many
                times as your group wants — the seed is shown every time.
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
          >
            Create circle and get the invite link
          </button>
        </form>

        {invite && (
          <div className="mt-8 rounded-xl border border-brass/50 bg-chalk p-5">
            <h2 className="text-xl font-semibold">{name} is ready</h2>
            <p className="mt-1 text-muted-foreground">
              Send this link to the other {members.length - 1} people. Each one claims
              their seat in the order above.
            </p>
            <p className="num mt-3 break-all rounded-md bg-parchment px-3 py-2.5 text-sm">
              {invite}
            </p>
            <Link
              to="/circle"
              className="mt-4 inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90"
            >
              Open the circle
            </Link>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Roundtable seats={seats} currentSeat={0} size={400} idle={false} />
        <dl className="mt-6 space-y-3 rounded-xl border border-border bg-chalk p-5">
          <Row k="Each person pays" v={`${Number(amount) || 0} XLM`} />
          <Row k="How often" v={cadence.toLowerCase()} />
          <Row k="Pot per cycle" v={`${potPerCycle.toLocaleString("en-US")} XLM`} />
          <Row k="Full rotation" v={`${members.length} cycles`} />
        </dl>
      </aside>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd className="num">{v}</dd>
    </div>
  );
}
