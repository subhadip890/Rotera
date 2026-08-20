# Rotera — frontend build plan

A rotating savings circle (ROSCA) app where a fixed group contributes the same amount each cycle and the whole pot goes to one member in turn. This build delivers the complete, production-quality interface with a mocked chain layer: real Freighter connect if the extension is present, and circle data held in app state so every screen is fully demo-able.

## Design direction

One bold idea, everything else quiet.

**The Roundtable** is the single signature element — a circular seating ring where each member holds a seat with a coin slot that fills as they pay. On payout, the pot flows into the recipient's seat, that seat glows brass, and the ring turns one notch. Built as an animated SVG/Canvas scene (sharper and far lighter on phones than 3D), it appears at three scales: ambient on the landing hero, compact and live on the dashboard, unrolled into a timeline on history. No competing metaphor — no icon-number-label card grid as the lead device.

**Tokens** (used exactly, no Tailwind default palette):
ink `#14213D`, verdigris `#2F6E62`, brass `#C9973C` (spent only on payout moments and the primary CTA), parchment `#EAE3CF`, chalk `#FAF8F3`, rust-signal `#B4553B` (late/error only).

**Type**: Fraunces for display (restrained — headlines and the payout number), Public Sans for body, IBM Plex Mono with tabular numerals for every amount, countdown, address, and cycle number.

**Copy**: "Pay my share", "your turn", "this cycle". Plain sentence case, no marketing filler, errors say what happened and what to do next.

Motion budget goes to three moments only: hero reveal, seat-fill on payment, payout sequence. Hover states 150–250ms ease-out. Full static-ring fallback under `prefers-reduced-motion`. Tables, forms, and body text stay still.

## Screens

- **Landing** — full-bleed Roundtable hero, off-center Fraunces headline, plain-language explainer of how a circle works for someone who has never used a wallet, one brass CTA.
- **Create circle** — amount, cycle length, member count, payout order by manual entry or "randomize for me" with the seed and method shown so the fairness is visible; produces an invite link.
- **Join circle** — invite acceptance, wallet connect, seat and rotation position confirmed, a "what you're agreeing to" summary before joining.
- **Dashboard** — live compact Roundtable, this cycle's amount and countdown to cutoff, per-member paid/waiting/late list, one-tap "Pay my share", who's next, payout confirmation moment.
- **History** — unrolled ring as a timeline, who received what and when, per-member reliability record.
- **Wallet** — connect/disconnect, truncated mono address, balance, testnet indicator.
- **Onboarding** — 4 skippable first-run steps covering wallets and the circle concept.
- **Feedback** — always-available corner button, rating plus optional note, non-blocking.

Every data-bearing screen ships loading skeletons matched to its real layout (the Roundtable idle-rotates as the dashboard's loading state), actionable empty states, specific plain-language errors with retry, and designed success confirmations.

Responsive from 360px up, visible keyboard focus everywhere, AA contrast on both parchment and chalk.

## Technical notes

- This project runs on TanStack Start with TanStack Router file-based routes; React Router is not available here. Routes will be `/`, `/create`, `/join`, `/circle`, `/history`, each with its own page metadata.
- Tokens go into `src/styles.css` as CSS variables mapped through `@theme inline`; fonts load via `<link>` in the root route.
- Adding: `motion` for animation, `zustand` for wallet/circle state, `@stellar/freighter-api` for wallet connect. TanStack Query is already present and will back the polling-shaped reads so a real contract can slot in later.
- Components organized under `src/components/roundtable`, `circle`, `onboarding`, `feedback`, `wallet`; hooks `useWallet`, `useCircleState`; `src/lib` for formatting and the mock contract client (single seam to swap for real Soroban calls).
- Mock data uses real circle content — named members, XLM amounts, weekly cycles — never placeholder text.
