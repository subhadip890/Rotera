import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Roundtable } from "@/components/roundtable/Roundtable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rotera — savings circles that run themselves" },
      {
        name: "description",
        content:
          "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar.",
      },
      { property: "og:title", content: "Rotera — savings circles that run themselves" },
      {
        property: "og:description",
        content:
          "A fixed group, the same contribution each week, and one payout per cycle. Rotera keeps the circle you already trust and replaces the organizer with a contract on Stellar.",
      },
    ],
  }),
  component: Landing,
});

const HERO_SEATS = [
  { id: "1", name: "Priya", status: "paid" as const },
  { id: "2", name: "Tunde", status: "paid" as const },
  { id: "3", name: "Mariela", status: "paid" as const },
  { id: "4", name: "You", status: "waiting" as const },
  { id: "5", name: "Samir", status: "late" as const },
  { id: "6", name: "Nomsa", status: "waiting" as const },
];

function Landing() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="num text-xs uppercase tracking-[0.18em] text-verdigris">
              Rotating savings · Stellar testnet
            </p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
              Everybody pays in.
              <br />
              <em className="font-light italic text-verdigris">One person</em> takes
              <br />
              the pot home.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              It's the arrangement your family already runs — chit fund, susu, tanda,
              ajo, stokvel. Rotera keeps the group exactly as it is and takes over the
              part people argue about: who's next, who has paid, and what happens when
              someone is late.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/create"
                className="rounded-md bg-brass px-6 py-3.5 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
              >
                Start a circle
              </Link>
              <Link
                to="/join"
                className="text-verdigris underline underline-offset-4 transition-colors duration-200 hover:text-ink"
              >
                I have an invite link
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Used by seven test circles across Lagos, Chennai and Cape Town during the
              testnet run.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="flex justify-center"
          >
            <Roundtable
              seats={HERO_SEATS}
              currentSeat={3}
              size={520}
              caption="Sunday Six · cycle 4 of 6 · 200 XLM each"
            />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-chalk">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-semibold">How a circle works</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                n: "01",
                h: "Agree once",
                p: "Six people, 200 XLM a week, and an order everyone can see. The order is fixed the moment the circle goes live — the organizer can't move themselves up.",
              },
              {
                n: "02",
                h: "Pay your share",
                p: "One tap each week before the cutoff. Rotera shows who has paid and who hasn't, so nobody has to chase anyone in a group chat.",
              },
              {
                n: "03",
                h: "Take your turn",
                p: "When the cycle closes, the whole pot — 1,200 XLM — lands with whoever's seat is up. Then the ring turns one notch.",
              },
            ].map((s) => (
              <div key={s.n}>
                <p className="num text-sm text-brass">{s.n}</p>
                <h3 className="mt-2 text-xl font-semibold">{s.h}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Never used a wallet? That's fine.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              A wallet is an account you hold yourself — no branch visit, no minimum
              balance. Rotera never takes custody of your money and never asks you for a
              password. You approve each payment, and the contract does the rest.
            </p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Contribution", "200 XLM"],
              ["Cycle", "Weekly"],
              ["Seats", "6"],
              ["Pot per cycle", "1,200 XLM"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-chalk p-4">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="num mt-1 text-2xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
