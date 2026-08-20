import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { randomizeOrder } from "@/lib/rotera";
import { useCreateCircleMutation } from "@/hooks/useSorobanQueries";
import { useRotera } from "@/store/useRotera";

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
  const navigate = useNavigate();
  const { wallet, connect, setActiveCircleId } = useRotera();
  const connected = wallet === "connected";

  // Test-mode flag — set VITE_ENABLE_TEST_CYCLES=true for accelerated Testnet demo cycles.
  // When true: only test cycle options are shown (no misleading Weekly/Biweekly/Monthly labels).
  const IS_TEST_MODE = import.meta.env["VITE_ENABLE_TEST_CYCLES"] === "true";

  const [name, setName] = useState("Sunday Six");
  const [amount, setAmount] = useState("200");
  // Default to 30-second test cycle in test mode; Weekly label in production mode.
  const [cadence, setCadence] = useState(IS_TEST_MODE ? "30s" : "Weekly");
  const [memberCount, setMemberCount] = useState(6);
  const [seed, setSeed] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<"Manual" | "RandomPending">("Manual");
  const [invite, setInvite] = useState<string | null>(null);
  const [realCircleId, setRealCircleId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createCircleMutation = useCreateCircleMutation();

  const seats = Array.from({ length: memberCount }, (_, i) => ({
    id: String(i),
    name: `Seat ${i + 1}`,
    status: "waiting" as const,
  }));

  const potPerCycle = (Number(amount) || 0) * memberCount;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!connected) {
      setError("Connect your Freighter wallet before creating a circle.");
      return;
    }

    if (!Number(amount) || Number(amount) <= 0) {
      setError("Set a contribution above 0 XLM — that's the amount each seat pays.");
      return;
    }

    if (memberCount < 3 || memberCount > 12) {
      setError("A circle needs between 3 and 12 members.");
      return;
    }

    try {
      const res = await createCircleMutation.mutateAsync({
        name,
        amount: Number(amount),
        cadence,
        memberCount,
        payoutOrderType: orderType,
      });

      setRealCircleId(res.circleId);
      setTxHash(res.txHash);
      setActiveCircleId(res.circleId);  // persist for dashboard use

      // Use the real on-chain circle ID in the invite URL
      const origin = typeof window !== "undefined" ? window.location.origin : "https://rotera.app";
      setInvite(`${origin}/join/${res.circleId}`);
    } catch (err: any) {
      setError(err?.message || "Could not submit contract transaction.");
    }
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

        {!connected && (
          <div className="mt-6 rounded-xl border border-border bg-chalk p-5">
            <p className="font-medium">Connect a wallet to create a circle</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Freighter wallet required. Your wallet signs the on-chain create transaction.
            </p>
            <button
              type="button"
              onClick={() => void connect()}
              disabled={wallet === "connecting"}
              className="mt-4 rounded-md bg-ink px-5 py-3 font-semibold text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
            >
              {wallet === "connecting" ? "Waiting for Freighter…" : "Connect wallet"}
            </button>
          </div>
        )}

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
                {IS_TEST_MODE ? (
                  // ── Accelerated Test Mode ────────────────────────────────
                  // The current Testnet contract interprets all values <= 3600
                  // as seconds. These options are the ONLY honest choices.
                  // Weekly/Biweekly/Monthly labels are intentionally hidden to
                  // avoid misrepresenting the cycle duration.
                  <>
                    <option value="10s">10-second test cycle</option>
                    <option value="30s">30-second test cycle</option>
                    <option value="60s">60-second test cycle</option>
                    <option value="5min">5-minute test cycle</option>
                  </>
                ) : (
                  // ── Production Mode (future mainnet contract) ────────────
                  // These labels are shown only when test mode is disabled.
                  // A mainnet contract using cycle_duration_seconds: u64 would
                  // receive 604800 / 1209600 / 2592000 seconds directly.
                  <>
                    <option value="Weekly">Weekly (7 days)</option>
                    <option value="Every two weeks">Every two weeks (14 days)</option>
                    <option value="Monthly">Monthly (30 days)</option>
                  </>
                )}
              </select>
              {IS_TEST_MODE && (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  ⚡ Accelerated Testnet demo — cycles run in seconds, not days.
                  Production cadences require a mainnet contract redeployment.
                </p>
              )}
            </Field>
            <Field label="Seats" htmlFor="c-seats">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMemberCount((n) => Math.max(3, n - 1))}
                  className="size-11 rounded-md border border-border bg-chalk text-lg transition-colors duration-200 hover:bg-parchment"
                  aria-label="Remove a seat"
                >
                  −
                </button>
                <span id="c-seats" className="num w-10 text-center text-lg">
                  {memberCount}
                </span>
                <button
                  type="button"
                  onClick={() => setMemberCount((n) => Math.min(12, n + 1))}
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
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={orderType === "RandomPending"}
                    onChange={(e) =>
                      setOrderType(e.target.checked ? "RandomPending" : "Manual")
                    }
                    className="rounded"
                  />
                  Randomize on-chain at activation
                </label>
              </div>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {orderType === "RandomPending"
                ? "Order will be deterministically shuffled using Stellar ledger data when the last seat is filled — verifiable on-chain."
                : "Seats are filled in join order. Share the invite link with members in your agreed payout sequence."}
            </p>

            {seed !== null && orderType === "Manual" && (
              <p className="num mt-3 rounded-md border border-border bg-chalk p-3 text-xs text-muted-foreground">
                Preview drawn with Fisher-Yates from seed {seed}. The binding order comes
                from the chain when the circle activates.
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
            disabled={createCircleMutation.isPending || !connected}
            className="rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
          >
            {createCircleMutation.isPending
              ? "Signing & creating circle on Stellar…"
              : "Create circle and get the invite link"}
          </button>
        </form>

        {invite && realCircleId && (
          <div className="mt-8 rounded-xl border border-brass/50 bg-chalk p-5">
            <h2 className="text-xl font-semibold">{name} is live on Stellar Testnet</h2>
            <p className="mt-1 text-muted-foreground">
              Send this link to your group. Each person claims their seat by connecting
              a wallet and joining.
            </p>
            <p className="num mt-3 break-all rounded-md bg-parchment px-3 py-2.5 text-sm">
              {invite}
            </p>
            {txHash && (
              <p className="num mt-2 text-xs text-muted-foreground">
                Circle #{realCircleId} · tx{" "}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-verdigris underline underline-offset-2"
                >
                  {txHash.slice(0, 8)}…{txHash.slice(-6)}
                </a>
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined") {
                  navigator.clipboard.writeText(invite).catch(() => {});
                }
              }}
              className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-parchment"
            >
              Copy invite link
            </button>
            <Link
              to="/join/$circleId"
              params={{ circleId: realCircleId! }}
              className="ml-3 mt-3 inline-block rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90"
            >
              Open circle
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
          <Row k="Full rotation" v={`${memberCount} cycles`} />
          <Row k="Payout order" v={orderType === "RandomPending" ? "Randomised on-chain" : "Join order"} />
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
