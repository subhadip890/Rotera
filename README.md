# Rotera — Savings Circles That Run Themselves

> **Level 4 — Green Belt Submission** | Stellar/Soroban Rotating Savings Circle (ROSCA) Protocol

Rotera takes the informal rotating savings arrangement used by billions of people worldwide — known as *chit funds* in India, *susu* in West Africa, *tanda* in Latin America, *stokvel* in South Africa, and *ajo* in Nigeria — and replaces the trusted human organizer with an automated, transparent smart contract on Stellar/Soroban.

---

## ?? What Rotera Does

1. **Agree Once**: A fixed group of members (e.g. 6 people) commit to a fixed contribution (e.g. 200 XLM) on a regular schedule (weekly/biweekly/monthly).
2. **Pay Your Share**: Each cycle, members contribute their share before the cutoff deadline. Rotera tracks who has paid and who has missed — no chasing in WhatsApp groups required.
3. **Take Your Turn**: When the cycle closes, the entire pot transfers to the wallet of whichever seat is up next. A keeper call triggers `close_cycle` after the deadline passes. The ring then turns one notch for the next cycle.

---

## ??? Architecture & Technical Design

```
+---------------------------------------------------------+
¦              Rotera TanStack Start Frontend             ¦
¦   (TanStack Router + Query + Zustand + Tailwind + Motion)¦
+---------------------------------------------------------+
               ¦                          ¦
               ?                          ?
+-----------------------------+ +-------------------------+
¦     Stellar/Soroban Smart   ¦ ¦   Observability & Data  ¦
¦          Contract           ¦ ¦ ----------------------- ¦
¦ --------------------------- ¦ ¦ • Sentry (Errors)       ¦
¦ • create_circle             ¦ ¦ • PostHog (Analytics)   ¦
¦ • join_circle               ¦ ¦ • Supabase (Feedback)   ¦
¦ • contribute                ¦ ¦ • Freighter Wallet API  ¦
¦ • close_cycle (Keeper)      ¦ +-------------------------+
¦ • repay_debt                ¦
¦ • get_status                ¦
¦ • withdraw_deposit          ¦
+-----------------------------+
```

### 1. Smart Contract (Soroban / Rust)

- **State Management**: Persists circle configurations, member payout ordering, individual deposit records (10% holdback), cycle contribution states, and outstanding debt history.
- **Permissionless Keeper Pattern**: `close_cycle` is callable by **any** signed account once `cycle_deadline` passes. It calculates collected funds, records missed payments as debt, pays the recipient, and advances the cycle.
- **Debt Model**: Missed contributions create on-chain debt. Members repay via `repay_debt()`. Only after debt is cleared can their 10% entry deposit be withdrawn.

### 2. Payout Order

**Join-order (Manual)**: Members receive payouts in join sequence.

**Randomised**: When the last seat is filled, the contract performs a deterministic Fisher-Yates shuffle using:
- Seed bytes 0–7: `ledger().timestamp()` (u64)
- Seed bytes 8–11: `ledger().sequence()` (u32)
- Seed bytes 12–15: constant `0xDEADBEEF`
- PRNG: LCG (multiplier 6364136223846793005)

This is fully on-chain and verifiable from the activation transaction. Ledger timestamp and sequence are predictable by validators — a documented trade-off for trust-based group savings.

### 3. Cycle Timing - Accelerated Testnet vs Production

> **Current Testnet Deployment is Accelerated Demo Mode.**
> The current Green Belt Testnet deployment does NOT use real weekly/monthly schedules.
> All cycles run in seconds for fast demonstration and review. This is intentional.

#### Current Deployed Contract - Dual-Mode calculate_deadline

The contract interprets \cycle_length_days: u32\ with this rule:

| Value | Branch | Result |
|-------|--------|--------|
| value <= 3600 | **Seconds** | deadline = now + value (seconds) |
| value > 3600 | Days | deadline = now + value x 86400 (seconds) |

#### Accelerated Test Mode (current Testnet deployment)

When \VITE_ENABLE_TEST_CYCLES=true\, the Create Circle form shows **only** these explicit test cycle options.
The misleading Weekly/Monthly labels are **intentionally hidden** when test mode is active.

| UI Label | Value sent | Actual deadline |
|----------|-----------|----------------|
| 10-second test cycle | 10 | now + 10 seconds |
| 30-second test cycle | 30 | now + 30 seconds |
| 60-second test cycle | 60 | now + 60 seconds |
| 5-minute test cycle | 300 | now + 300 seconds |

#### Why Production Cadences Cannot Work on the Current Contract

There is no value that correctly expresses a 7-day deadline with the dual-mode contract:

- Send 7: 7 <= 3600 -> seconds branch -> **7 seconds** (NOT 7 days)
- Send 604800: 604800 > 3600 -> days branch -> **604800 x 86400 = ~1,656 years** (wrong)

Proven by the \	est_production_604800_on_current_contract_is_wrong\ contract test.

#### Production / Mainnet Plan

A mainnet redeployment uses \cycle_duration_seconds: u64\ (no dual-mode branch):

| UI Label | Value sent | Actual deadline |
|----------|-----------|----------------|
| Weekly (7 days) | 604,800 | now + 604,800s = exactly 7 days |
| Every two weeks | 1,209,600 | now + 1,209,600s = exactly 14 days |
| Monthly (30 days) | 2,592,000 | now + 2,592,000s = exactly 30 days |

Documented in \PRODUCTION_CADENCES_SECONDS\ (useSorobanQueries.ts).
Verified by the \	est_production_cadence_math\ contract test (41 total tests pass).

### 4. Frontend Data Architecture

- **TanStack Query** is the sole source of truth for all blockchain state. Page refresh or new browser reconstructs state from Soroban — no stale local data.
- **Zustand** holds only transient UI state (wallet status, onboarding, payout modal).
- All financial mutations require Freighter wallet signing.

---

## ?? On-Chain Smart Contract

- **Network**: Stellar Testnet
- **Contract ID**: `CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4`
- **RPC Endpoint**: `https://soroban-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`

---

## ? Setup & Local Development

### Prerequisites
- Node.js (v18+) or Bun
- Rust + `wasm32-unknown-unknown` target (for contract builds)
- Freighter Browser Wallet Extension

### Installation

```bash
git clone https://github.com/subhadip890/Rotera.git
cd Rotera
npm install
cp .env.example .env
npm run dev
```

### Key Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SOROBAN_CONTRACT_ID` | Deployed contract address |
| `VITE_SOROBAN_RPC_URL` | Soroban RPC endpoint |
| `VITE_ENABLE_TEST_CYCLES` | `"true"` ? shows quick-test cycle options (10s/30s/60s/5min) in Create form |
| `VITE_POSTHOG_KEY` | PostHog analytics key |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |
| `VITE_SUPABASE_URL` | Supabase URL for feedback |

### Running Contract Tests

```bash
cd contracts/rosca
cargo test
```

**41 tests pass**, covering: circle creation, joining/activation, contributions, `close_cycle` payout transfers, full rotation, deposit withdrawal, `repay_debt` (partial/full/overpayment/unauthorized), random ordering seed verification, cycle timing (10s/30s/60s/5min), production cadence math, and proof that production values cannot be used with the current Testnet contract.

---

## ?? Known Trade-offs

1. **Permissionless Keeper**: `close_cycle` must be triggered externally after deadline. Anyone can call it.
2. **Shortfall Handling**: Missed contributions reduce payout and create on-chain debt. `repay_debt()` lets members settle.
3. **Early-Exit Protection**: 10% entry deposit held until circle completion and full debt clearance.
4. **Randomness Source**: Ledger timestamp + sequence — deterministic but predictable by validators. Acceptable for trust-based group savings.
5. **Read-Only Simulation Account**: Soroban read calls use a Stellar Foundation public account solely for fee simulation — it never signs user transactions or holds funds.

---

## ?? Submission Checklist

- [x] **Public GitHub Repository**: [github.com/subhadip890/Rotera](https://github.com/subhadip890/Rotera)
- [x] **15+ Meaningful Commits**: Clean Git commit history
- [x] **Stellar Testnet Deployment**: `CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4`
- [x] **Real Wallet Support**: Freighter API — all transactions require wallet signing
- [x] **Analytics & Monitoring**: PostHog funnel tracking + Sentry error capture
- [x] **Feedback Collection**: Supabase-backed feedback widget
- [x] **Mobile Responsive**: Tested across desktop and mobile
- [x] **37 Contract Tests**: Full test suite covering all core functions
