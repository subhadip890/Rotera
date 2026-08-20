# Rotera — Memory File (remem.md)

## Project Overview
Rotera is an on-chain rotating savings circle (ROSCA) app on Stellar/Soroban. It replaces the human organizer in informal savings groups (chit funds, susu, tanda, ajo, stokvel) with a smart contract.

## Architecture
- **Frontend**: TanStack Start (Router + Query + Zustand + Tailwind v4 + Motion)
- **Smart Contract**: Soroban/Rust at `contracts/rosca/` — built with `create_circle`, `join_circle`, `contribute`, `close_cycle`, `get_status`, `withdraw_deposit`
- **State**: Zustand (`src/store/useRotera.ts`) for UI state; TanStack Query for chain data
- **Design tokens**: ink (#14213d) / verdigris (#2f6e62) / brass (#c9973c) / parchment (#eae3cf) / chalk (#faf8f3) / rust-signal (#b4553b)
- **Fonts**: Fraunces (display), Public Sans (body), IBM Plex Mono (numbers)

## Current State
- Root project uses TanStack Start frontend
- Smart contract at `contracts/rosca/` — complete with types, errors, tests
- Contract has: CircleState, MemberState, CycleRecord types; Manual + RandomPending payout order; deposit mechanism (10% holdback); permissionless keeper close_cycle

## Key Files
- `src/routes/__root.tsx` — RootShell + RootComponent with QueryClientProvider, SiteHeader, SiteFooter, FeedbackWidget
- `src/routes/index.tsx` — Landing page with hero Roundtable + 3-step explainer
- `src/routes/create.tsx` — Circle creation form + live Roundtable preview + invite link
- `src/routes/join.tsx` — Invite acceptance + agreement summary
- `src/routes/circle.tsx` — Dashboard: live Roundtable, countdown, pay/close, payout modal
- `src/routes/history.tsx` — Payout timeline
- `src/components/SiteChrome.tsx` — Header/footer (footer contract address read from env)
- `src/components/roundtable/Roundtable.tsx` — SVG+Motion rotating seat ring
- `src/components/wallet/WalletButton.tsx` — Wallet connect/disconnect
- `src/components/feedback/FeedbackWidget.tsx` — Rating + note (persisted to Supabase)
- `src/components/onboarding/Onboarding.tsx` — 4-step skippable modal
- `src/store/useRotera.ts` — Zustand store
- `src/lib/rotera.ts` — Domain types, helpers, demo data
- `src/router.tsx` — TanStack Router + QueryClient
- `src/start.ts` — TanStack Start middleware
- `src/server.ts` — SSR error wrapper
- `src/styles.css` — Design tokens + utilities

## Integrations Active
1. `useRotera.connect()` — real Freighter wallet connection with persistence
2. `FeedbackWidget.tsx` — Supabase persistence + PostHog event tracking
3. `SiteFooter` contract address — dynamically derived from env config
4. `Sentry` — initialization & exception capture in root component

## Smart Contract (contracts/rosca/)
- `create_circle(organizer, name, contribution_amount, cycle_length_days, members, payout_order)`
- `join_circle(member, circle_id)` — marks deposit paid, activates when all joined
- `contribute(member, circle_id)` — records contribution for current cycle
- `close_cycle(circle_id)` — permissionless keeper, tracks missed payments as debt
- `get_status(circle_id)` — returns full CircleState
- `withdraw_deposit(member, circle_id)` — after completion, if no debt
- Types: CircleState, MemberState, CycleRecord, CircleStatus, PayoutOrderType
- Tests: 14 unit tests in `src/test.rs` covering creation, validation, activation, contribution, missed payments, full rotation, and deposit withdrawal (all 14 passed).

## Environment Variables Needed
- `VITE_SOROBAN_CONTRACT_ID` — deployed contract address
- `VITE_SOROBAN_RPC_URL` — Stellar testnet RPC
- `VITE_SOROBAN_NETWORK_PASSPHRASE` — testnet passphrase
- `VITE_POSTHOG_KEY` — PostHog project key
- `VITE_SENTRY_DSN` — Sentry DSN
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key

## Git Remote
- Push to: https://github.com/subhadip890/Rotera.git
- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`
- Need 15+ meaningful commits
- Do NOT force-push or rebase existing history
