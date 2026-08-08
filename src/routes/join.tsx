import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a circle — Rotera" },
      {
        name: "description",
        content:
          "Claim your seat in a savings circle by opening the invite link your circle organiser sent you.",
      },
    ],
  }),
  component: JoinIndex,
});

function JoinIndex() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center">
      <h1 className="text-3xl font-semibold">Open your invite link</h1>
      <p className="mt-4 text-muted-foreground">
        Your circle organiser sent you a link that looks like:
      </p>
      <p className="num mt-4 rounded-md bg-chalk px-4 py-3 text-sm text-muted-foreground">
        rotera.app/join/<span className="text-ink">123</span>
      </p>
      <p className="mt-4 text-muted-foreground">
        Open that link to see the circle details and claim your seat.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/create"
          className="rounded-md bg-brass px-5 py-3 font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
        >
          Start your own circle
        </Link>
        <Link
          to="/"
          className="rounded-md border border-border bg-chalk px-5 py-3 font-medium transition-colors duration-200 hover:bg-parchment"
        >
          Learn how it works
        </Link>
      </div>
    </div>
  );
}
