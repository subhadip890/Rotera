/**
 * Rotera — Shared page transition variants for Framer Motion.
 * Used by all page components for consistent enter/exit animations.
 */

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
}
