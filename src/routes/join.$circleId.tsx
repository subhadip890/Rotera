import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Roundtable } from "@/components/roundtable/Roundtable";
import { useRotera } from "@/store/useRotera";
import {
  useJoinCircleMutation,
  useCircleState,
  useCircleMemberNames,
  stroopsToXlm,
} from "@/hooks/useSorobanQueries";
import { upsertCircleMemberName } from "@/lib/supabase";

export const Route = createFileRoute("/join/$circleId")({
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

function JoinCircle() {
  const navigate = useNavigate();
  const { circleId } = Route.useParams();
  const { wallet, address, connect, setActiveCircleId } = useRotera();
  const joinMutation = useJoinCircleMutation();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const connected = wallet === "connected";

  // Load real circle data from chain
  const { data: circle, isLoading, isError } = useCircleState(circleId);

  // Load member display names from Supabase
  const { data: memberNames } = useCircleMemberNames(circleId);
  const namesByAddress = memberNames || new Map<string, string>();

  // Pre-fill display name if user previously saved one for this circle
  useEffect(() => {
    if (address && namesByAddress.has(address) && !displayName) {
      setDisplayName(namesByAddress.get(address) || "");
    }
  }, [address, namesByAddress, displayName]);

  async function handleTakeSeat() {
    setError(null);
    if (!connected) {
      setError("Connect your wallet first.");
      return;
    }

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Please enter your name for this circle.");
      return;
    }
    if (trimmedName.length > 40) {
      setError("Your name must be 40 characters or fewer.");
      return;
    }

    try {
      const res = await joinMutation.mutateAsync({ circleId });
      setTxHash(res.txHash);
      setJoined(true);
      setActiveCircleId(circleId);  // persist for dashboard use

      // Persist display name to Supabase (graceful degradation if not configured or failed)
      if (address) {
        await upsertCircleMemberName(circleId, address, trimmedName).catch((err) => {
          console.warn("[Rotera] Failed to save display name to Supabase:", err);
        });
      }
    } catch (err: any) {
      setError(err?.message || "Join transaction failed. Check your wallet and try again.");
    }
  }

  // Build seats for Roundtable from chain data & display names based on circle.member_count
  const seats = circle
    ? Array.from({ length: circle.member_count }, (_, i) => {
        if (i < circle.payout_order.length) {
          const addr = circle.payout_order[i] || "";
          const isMe = Boolean(address && addr === address);
          const name = isMe
            ? "You"
            : (namesByAddress.get(addr) || truncateAddr(addr));
          return {
            id: addr,
            name,
            status: "waiting" as const,
          };
        } else {
          return {
            id: `seat-${i}`,
            name: `Seat ${i + 1}`,
            status: "waiting" as const,
          };
        }
      })
    : Array.from({ length: 6 }, (_, i) => ({
        id: `seat-${i}`,
        name: `Seat ${i + 1}`,
        status: "waiting" as const,
      }));

  // Figure out which seat the current user would occupy
  const userSeatIndex = circle
    ? circle.payout_order.findIndex((a) => a === address)
    : -1;
  const currentSeat = userSeatIndex >= 0 ? userSeatIndex : circle?.payout_order.length ?? 0;

  const contributionXlm = circle
    ? stroopsToXlm(circle.contribution_amount)
    : null;

  const totalSeats = circle?.member_count ?? 6;
  const seatsAvailable = circle ? totalSeats - circle.payout_order.length : 0;
  const isFull = circle?.status === "Active" || circle?.status === "Completed";
  const alreadyJoined = address ? circle?.payout_order.includes(address) : false;

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-12 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
          Invite · circle #{circleId}
        </p>

        {isLoading && (
          <div className="mt-6">
            <div className="h-8 w-64 animate-pulse rounded bg-border" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-border" />
          </div>
        )}

        {isError && (
          <div className="mt-6 rounded-xl border border-rust/40 bg-rust/10 p-5">
            <p className="font-medium text-rust">Circle not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Make sure the invite link is correct and that the contract is deployed to Testnet.
            </p>
          </div>
        )}

        {circle && (
          <>
            <h1 className="mt-3 text-4xl font-semibold">
              Join {circle.name}
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {totalSeats} people, {totalSeats} cycles, one payout each.
              Read the agreement below — after you join, none of it can change.
            </p>

            <h2 className="mt-10 text-xl font-semibold">What you're agreeing to</h2>
            <ul className="mt-4 space-y-3">
              {[
                `You pay ${contributionXlm} XLM every cycle before the cutoff.`,
                `There are ${totalSeats} seats — ${seatsAvailable} still available.`,
                `If you miss the cutoff, your contribution is recorded as missed and an on-chain debt is tracked against your account.`,
                `You can't leave once the first payout has gone out — your seat stays in the rotation.`,
                circle.payout_order_type === "RandomPending"
                  ? "Payout order is deterministically shuffled using Stellar ledger data when all seats are filled — verifiable on-chain."
                  : "Payout order is set in join sequence — first to join receives first.",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-verdigris" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid gap-3 rounded-xl border border-border bg-chalk p-5 sm:grid-cols-3">
              <Row k="Contribution" v={`${contributionXlm} XLM`} />
              <Row
                k="Cycle length"
                v={`${circle.cycle_length_days} days`}
              />
              <Row k="Seats left" v={`${seatsAvailable} of ${totalSeats}`} />
            </dl>

            {circle.payout_order.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-border bg-chalk">
                <p className="border-b border-border px-5 py-3 text-sm font-semibold">
                  Members so far ({circle.payout_order.length}/{totalSeats})
                </p>
                <ul>
                  {circle.payout_order.map((addr, i) => (
                    <li
                      key={addr}
                      className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0"
                    >
                      <span className="num w-6 text-sm text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="num text-sm font-medium">
                        {namesByAddress.get(addr) || truncateAddr(addr)}
                      </span>
                      {addr === address && (
                        <span className="ml-auto rounded-full bg-verdigris/15 px-2 py-0.5 text-xs text-verdigris">
                          You
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-md border border-rust/40 bg-rust/10 p-3 text-sm text-rust"
          >
            {error}
          </p>
        )}

        {joined && txHash && (
          <div className="mt-6 rounded-xl border border-verdigris/40 bg-verdigris/5 p-5">
            <p className="font-semibold text-verdigris">You've joined the circle!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your deposit is locked in the contract. You'll be notified when the circle activates.
            </p>
            <p className="num mt-2 text-xs text-muted-foreground">
              tx{" "}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-verdigris underline underline-offset-2"
              >
                {txHash.slice(0, 8)}…{txHash.slice(-6)}
              </a>
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: `/circle` })}
              className="mt-4 rounded-md bg-ink px-5 py-3 font-semibold text-chalk transition-opacity duration-200 hover:opacity-90"
            >
              Go to my circle
            </button>
          </div>
        )}

        {!joined && circle && (
          <div className="mt-10 rounded-xl border border-border bg-chalk p-5">
            {isFull ? (
              <p className="font-medium text-rust">This circle is full — no seats available.</p>
            ) : alreadyJoined ? (
              <p className="font-medium text-verdigris">
                You're already in this circle. The circle activates when all {totalSeats} seats are filled.
              </p>
            ) : connected ? (
              <>
                <p className="font-medium">Wallet connected — a seat is waiting for you.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Joining requires a small deposit ({circle ? stroopsToXlm(circle.deposit_amount) : "—"} XLM)
                  held by the contract until the circle completes.
                </p>

                <div className="mt-4">
                  <label htmlFor="member-display-name" className="block text-sm font-medium text-ink">
                    Your name in this circle <span className="text-rust">*</span>
                  </label>
                  <input
                    id="member-display-name"
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Alex, Sarah M., Subhadip"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (error) setError(null);
                    }}
                    className="mt-1.5 w-full rounded-md border border-border bg-chalk px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-muted-foreground/60 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                    disabled={joinMutation.isPending}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Shown to other circle members on the rotation ring and payout board.
                  </p>
                </div>

                <button
                  onClick={() => void handleTakeSeat()}
                  disabled={joinMutation.isPending}
                  className="mt-5 rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                >
                  {joinMutation.isPending ? "Signing join transaction…" : "Take a seat"}
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">Connect a wallet to claim your seat</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Freighter wallet required. Nothing leaves your wallet until you approve the deposit.
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
                  <Link
                    to="/"
                    hash="wallets"
                    className="text-verdigris underline underline-offset-4"
                  >
                    Read how wallets work first
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Roundtable
          seats={seats}
          currentSeat={currentSeat}
          size={380}
          caption={
            isFull
              ? "Circle is full"
              : `${seatsAvailable} seat${seatsAvailable !== 1 ? "s" : ""} available`
          }
        />
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="num font-medium">{v}</dd>
    </div>
  );
}

function truncateAddr(addr: string): string {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
