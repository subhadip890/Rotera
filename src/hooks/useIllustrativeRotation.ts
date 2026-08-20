import { useState, useEffect } from "react";
import type { Seat } from "@/components/roundtable/Roundtable";

const ILLUSTRATIVE_NAMES = [
  "Seat A",
  "Seat B",
  "Seat C",
  "Seat D",
  "Seat E",
  "Seat F",
];

const CAPTIONS = [
  "Everybody pays in.",
  "One person takes the pot home.",
  "Then it's someone else's turn.",
];

/**
 * Hook providing a looping illustrative rotation of seats and sequential captions
 * when no real circle data is present on the landing page.
 */
export function useIllustrativeRotation(enabled: boolean = true) {
  const [step, setStep] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsReducedMotion(mq.matches);

      const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
      mq.addEventListener?.("change", handler);
      return () => mq.removeEventListener?.("change", handler);
    }
  }, []);

  useEffect(() => {
    if (!enabled || isReducedMotion) return;

    const interval = setInterval(() => {
      setStep((prev) => prev + 1);
    }, 1800);

    return () => clearInterval(interval);
  }, [enabled, isReducedMotion]);

  if (isReducedMotion) {
    return {
      seats: ILLUSTRATIVE_NAMES.map((name, i) => ({
        id: `illustrative-${i + 1}`,
        name,
        status: i === 0 ? ("paid" as const) : ("waiting" as const),
      })),
      currentSeat: 0,
      caption: CAPTIONS[0],
    };
  }

  const currentSeat = step % 6;
  const lap = Math.floor(step / 6);
  const caption = CAPTIONS[lap % CAPTIONS.length];

  const seats: Seat[] = ILLUSTRATIVE_NAMES.map((name, i) => {
    let status: "paid" | "waiting" | "late" = "waiting";
    if (i < currentSeat) {
      status = "paid";
    }
    return {
      id: `illustrative-${i + 1}`,
      name,
      status,
    };
  });

  return {
    seats,
    currentSeat,
    caption,
  };
}
