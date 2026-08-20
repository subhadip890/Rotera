import { useState } from "react";
import { motion } from "motion/react";
import { useRotera } from "@/store/useRotera";

const STEPS = [
  {
    title: "A circle is a group of people who already trust each other",
    body: "Six friends, one shared agreement: everyone pays the same amount each week, and each week the whole pot goes to one person. After six weeks, everyone has had their turn.",
  },
  {
    title: "Rotera only enforces the rules you agreed on",
    body: "Who's next, who has paid, what counts as late. Once the circle is live, nobody can change the order — not even the person who set it up.",
  },
  {
    title: "Your wallet is your seat",
    body: "A wallet is just an account you control. Rotera never holds your money and never asks for a password. You approve each payment yourself, and you can walk away from the app at any time.",
  },
  {
    title: "You're on testnet",
    body: "Everything here uses test XLM, so nothing costs real money. Try paying a share and closing a cycle before you invite anyone.",
  },
];

export function Onboarding() {
  const finish = useRotera((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const current = STEPS[step]!;
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        role="dialog"
        aria-modal="true"
        aria-label="Getting started with Rotera"
        className="w-full max-w-md rounded-2xl border border-border bg-chalk p-6"
      >
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-verdigris" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="num mt-4 text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">{current.title}</h2>
        <p className="mt-3 text-muted-foreground">{current.body}</p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-ink transition-opacity duration-200 hover:opacity-90"
          >
            {last ? "Take me to my circle" : "Next"}
          </button>
          <button
            onClick={finish}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-ink"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </div>
  );
}
