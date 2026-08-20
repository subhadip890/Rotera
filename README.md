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

### 3. Cycle Timing (Dual-Mode)

`calculate_deadline` uses dual-mode interpretation of `cycle_length_days`:

| Value sent | Branch | Deadline |
|------------|--------|----------|
| = 3600 | Seconds (test) | `now + value` |
| > 3600 | Days (production) | `now + value × 86400` |

Production cadences (Weekly=7, Biweekly=14, Monthly=30) use the days branch.
Set `VITE_ENABLE_TEST_CYCLES=true` to expose 10s/30s/60s/5min quick-test options.

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

**37 tests pass**, covering: circle creation, joining/activation, contributions, `close_cycle` payout transfers, full rotation, deposit withdrawal, `repay_debt` (partial/full/overpayment/unauthorized), random ordering seed verification, and cycle timing semantics.

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
