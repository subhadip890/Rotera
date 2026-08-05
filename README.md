# Rotera

**Rotating savings circles (ROSCA) on Stellar/Soroban.**

Rotera puts the system people already use worldwide — chit fund, susu, tanda, ajo, stokvel — on-chain. A smart contract enforces the rules so nobody can bend them. Your group stays in charge.

---

## What it does

A fixed group contributes the same amount on a regular schedule. Each cycle, the full pot goes to one member in a pre-agreed or randomized order. The contract enforces this automatically — no middleman, no spreadsheet, no chasing people.

**Key mechanics:**
- Entry deposit (~10% of total expected contributions) held until completion — discourages drop-outs
- Missed contributions tracked as debt against the late member's own payout — group is never penalized
- Permissionless cycle-close: anyone can call `close_cycle` after the deadline
- Randomized ordering via future Stellar ledger sequence hash (verifiable, unpredictable at setup time)

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + TypeScript |
| Styling | Vanilla CSS design system (tokens.css) |
| 3D hero | React Three Fiber + Three.js |
| Animations | Framer Motion |
| State | TanStack Query + Zustand |
| Wallet | Freighter / Stellar Wallets Kit |
| Blockchain | Stellar / Soroban smart contract (Rust) |
| Analytics | PostHog |
| Monitoring | Sentry |
| Feedback | Supabase |

---

## Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

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

---

## Contract

The Soroban contract is in `contracts/rosca/`. It implements:

- `create_circle` — organizer sets up the circle
- `join_circle` — member confirms seat and pays deposit
- `contribute` — member pays their cycle share
- `close_cycle` — permissionless keeper call after deadline
- `get_status` — read current state (dashboard)
- `withdraw_deposit` — returns held deposit after circle completion

### Deploy to Stellar Testnet

Requires the [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/):

```bash
chmod +x contracts/deploy.sh
./contracts/deploy.sh
```

The script funds a deployer account via Friendbot, builds the WASM, deploys the contract, and writes the contract ID to your `.env`.

### Run contract tests

Requires the Rust toolchain with `wasm32-unknown-unknown` target:

```bash
cd contracts/rosca
cargo test
```

---

## Design system

Rotera uses a deliberate, restricted color palette — not generic fintech:

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#14213D` | Primary text, dark surfaces |
| `--verdigris` | `#2F6E62` | Structural / active / rotation ring |
| `--brass` | `#C9973C` | **Single accent** — payout moment, primary CTA |
| `--parchment` | `#EAE3CF` | Warm background |
| `--chalk` | `#FAF8F3` | Card surfaces |
| `--rust-signal` | `#B4553B` | Late / overdue / error only |

Typography: Fraunces (display), Public Sans (body), IBM Plex Mono (financial data).

---

## Project structure

```
src/
  components/
    wallet/          # Freighter connect, WalletProvider, ConnectButton
    roundtable/      # 3D Roundtable (React Three Fiber + SVG fallback)
    layout/          # Navbar
    onboarding/      # First-visit onboarding flow
    feedback/        # Floating feedback widget (Supabase)
  pages/
    Landing.tsx      # Hero + 3D Roundtable
    CreateCircle.tsx # 3-step circle creation form
    JoinCircle.tsx   # Invite accept flow
    Dashboard.tsx    # Live circle state, pay CTA, member list
    History.tsx      # Cycle timeline + reliability records
  lib/
    contract.ts      # TypeScript contract client + types
    format.ts        # Amounts, dates, addresses formatting
    stellar.ts       # Network config
    motion.ts        # Shared Framer Motion presets
  styles/
    tokens.css       # Design tokens
    index.css        # Global styles + component patterns
contracts/
  rosca/
    src/
      lib.rs         # Main contract (create, join, contribute, close)
      types.rs       # CircleState, MemberState, CycleRecord
      errors.rs      # RoteraError enum
      test.rs        # Full test suite
  deploy.sh          # Testnet deploy script
```

---

## License

MIT
