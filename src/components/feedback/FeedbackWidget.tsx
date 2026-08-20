import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { submitFeedbackToSupabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/posthog";
import { useRotera } from "@/store/useRotera";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const { address } = useRotera();

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;
    setSubmitting(true);
    setError(null);

    try {
      const ok = await submitFeedbackToSupabase({
        wallet_address: address,
        rating,
        comment: note.trim(),
        page: window.location.pathname,
      });

      if (!ok) {
        throw new Error("Failed to store feedback in database.");
      }

      trackEvent("feedback_submitted", {
        rating,
        has_note: note.trim().length > 0,
        page: window.location.pathname,
      });

      setSent(true);
    } catch (err: any) {
      console.error("[Feedback Submit Error]:", err);
      setError(err?.message || "Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-border bg-chalk px-4 py-2.5 text-sm font-medium shadow-sm transition-colors duration-200 hover:bg-parchment"
      >
        Feedback
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 right-5 z-40 w-[min(20rem,calc(100vw-2.5rem))] rounded-xl border border-border bg-chalk p-4 shadow-lg"
            role="dialog"
            aria-label="Send feedback"
          >
            {sent ? (
              <div>
                <p className="font-medium">Thanks — that's logged.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We read every note while the testnet build is live.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    setSent(false);
                    setRating(null);
                    setNote("");
                  }}
                  className="mt-3 text-sm text-verdigris underline underline-offset-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="text-sm font-medium">How's Rotera working for you?</p>
                <div className="mt-3 flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`Rate ${n} out of 5`}
                      aria-pressed={rating === n}
                      className={`num size-9 rounded-md border text-sm transition-colors duration-200 ${
                        rating === n
                          ? "border-brass bg-brass text-ink"
                          : "border-border hover:bg-parchment"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <label htmlFor="fb-note" className="mt-3 block text-sm text-muted-foreground">
                  Anything else? (optional)
                </label>
                <textarea
                  id="fb-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm"
                  placeholder="The countdown was confusing…"
                />
                {error && (
                  <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    disabled={rating === null || submitting}
                    className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-chalk transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-ink"
                  >
                    Not now
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
