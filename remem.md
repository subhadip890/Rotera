# Rotera — Session Memory

## Project
On-chain rotating savings circle (ROSCA) app on Stellar/Soroban.
GitHub: https://github.com/subhadip890/Rotera.git
Local: c:\Users\subha\OneDrive\Apps\Rotera

## Current State
All core frontend + contract work complete. Clean production build.

## Commits pushed (GitHub main branch)
1. Project scaffold (Vite + React + TypeScript + Tailwind + design tokens)
2. Wallet connect (Freighter + WalletProvider + ConnectButton + WalletPanel)
3. Landing page + Roundtable 3D hero (React Three Fiber + Framer Motion)
4+5. Create Circle flow (3-step form) + Join Circle flow (invite accept)
6-9. Soroban ROSCA contract (types, errors, full logic, test suite, deploy script)
10-15. Dashboard, History timeline, Onboarding flow, Feedback widget, lazy routes

## Architecture Summary
- Vite v8, React 19, TypeScript strict
- Tailwind CSS v4 (via @tailwindcss/vite)
- Design system: tokens.css → index.css → Tailwind @theme extension
- Fonts: Fraunces (display), Public Sans (body), IBM Plex Mono (mono)
- Pages lazy-loaded for code splitting (Three.js → roundtable chunk ~900KB)
- WalletProvider wraps entire app, persists address to localStorage
- Contract types in src/lib/contract.ts (mirrors Soroban types)
- Demo data factory (createDemoCircle) used until real contract deployed

## Design Tokens
- --ink: #14213D (primary text)
- --verdigris: #2F6E62 (structural, active, links)
- --brass: #C9973C (single accent — payout, primary CTA)
- --parchment: #EAE3CF (background)
- --chalk: #FAF8F3 (card surface)
- --rust-signal: #B4553B (error/late only)

## Key Files
- src/App.tsx — lazy routes, FeedbackWidget always mounted
- src/pages/Landing.tsx — hero + onboarding trigger
- src/pages/Dashboard.tsx — live circle state, pay CTA
- src/pages/CreateCircle.tsx — 3-step form
- src/pages/JoinCircle.tsx — invite accept + agreement
- src/pages/History.tsx — cycle timeline + reliability bars
- src/components/wallet/WalletProvider.tsx — Freighter connect
- src/components/roundtable/RoundtableCanvas.tsx — 3D + SVG fallback
- src/components/onboarding/OnboardingFlow.tsx — 4-step onboarding
- src/components/feedback/FeedbackWidget.tsx — floating star rating
- src/lib/contract.ts — contract types + demo data factory
- contracts/rosca/src/lib.rs — full Soroban contract
- contracts/deploy.sh — testnet deploy script

## What still needs doing (for Green Belt submission)
1. **Deploy contract to testnet** — run contracts/deploy.sh (needs Stellar CLI)
   - Write real contract ID to .env → VITE_CONTRACT_ID=C...
2. **Wire contract client** — replace demo data in Dashboard/JoinCircle with
   real Soroban reads once contract is deployed
3. **PostHog analytics** — add VITE_POSTHOG_KEY to .env, initialize in main.tsx
4. **Sentry monitoring** — add VITE_SENTRY_DSN to .env, initialize in main.tsx
5. **Supabase feedback** — create feedback table, add env vars
6. **Collect 10+ user feedback** — share with real users

## Known Issues
- Three.js chunk is 903KB (gzipped 240KB) — normal for R3F, lazy-loaded
- Contract not yet deployed (demo data used everywhere)
- Freighter extension required for wallet connect (no fallback)

## Env Vars Needed
```
VITE_STELLAR_NETWORK=testnet
VITE_CONTRACT_ID=<deployed contract address>
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_POSTHOG_KEY=<posthog project api key>
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_SENTRY_DSN=<sentry dsn>
VITE_SUPABASE_URL=<supabase project url>
VITE_SUPABASE_ANON_KEY=<supabase anon key>
```

## PowerShell Notes
- Use `;` not `&&` to chain commands
- Quote packages with `@` scope: npm install "@creit.tech/stellar-wallets-kit"
- manualChunks as object not supported in Vite v8/rolldown — use limit only
