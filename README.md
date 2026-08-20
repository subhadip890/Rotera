# Rotera — Savings Circles That Run Themselves

> **Level 4 — Green Belt Submission** | Stellar/Soroban Rotating Savings Circle (ROSCA) Protocol

Rotera takes the informal rotating savings arrangement used by billions of people worldwide — known as *chit funds* in India, *susu* in West Africa, *tanda* in Latin America, *stokvel* in South Africa, and *ajo* in Nigeria — and replaces the trusted human organizer with an automated, transparent smart contract on Stellar/Soroban.

---

## 🌟 What Rotera Does

1. **Agree Once**: A fixed group of members (e.g. 6 people) commit to a fixed contribution (e.g. 200 XLM) on a regular schedule (weekly/biweekly/monthly).
2. **Pay Your Share**: Each cycle, members contribute their share before the cutoff deadline. Rotera tracks who has paid and who is late — no chasing in WhatsApp groups required.
3. **Take Your Turn**: When the cycle closes, the entire pot lands automatically in the wallet of whichever seat is up next. The ring then turns one notch for the next cycle.

---

## 🏗️ Architecture & Technical Design

Rotera consists of a client-side frontend, Soroban smart contracts, monitoring, and analytical data layers:

```
┌─────────────────────────────────────────────────────────┐
│              Rotera TanStack Start Frontend             │
│   (TanStack Router + Query + Zustand + Tailwind + Motion)│
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌─────────────────────────┐
│     Stellar/Soroban Smart   │ │   Observability & Data  │
│          Contract           │ │ ─────────────────────── │
│ ─────────────────────────── │ │ • Sentry (Errors)       │
│ • create_circle             │ │ • PostHog (Analytics)   │
│ • join_circle               │ │ • Supabase (Feedback)   │
│ • contribute                │ │ • Freighter Wallet      │
│ • close_cycle (Keeper)      │ └─────────────────────────┘
│ • get_status                │
│ • withdraw_deposit          │
└─────────────────────────────┘
```

### 1. Smart Contract (Soroban / Rust)
- **State Management**: Persists circle configurations, member payout ordering, individual deposit records (10% holdback against early dropout), cycle contribution states, and outstanding debt history.
- **Permissionless Keeper Pattern**: Soroban contracts cannot self-trigger on timer expiration. `close_cycle` is implemented as a permissionless keeper method callable by any address once `cycle_deadline` passes. It calculates collected funds, records missed payments as debt against future turns, pays out the recipient, and advances the cycle.

### 2. Frontend Layer
- Built with **TanStack Start** (TanStack Router, Query, Zustand, Tailwind CSS v4, Motion).
- Features the signature **Roundtable** seat rotation visualizer (`Roundtable.tsx`), showing live seat statuses (Paid / Waiting / Late / Recipient) and animated rotation turns.

### 3. Monitoring & Analytics
- **Sentry**: Captures client exceptions, wallet connection rejections, contract execution errors, and boundary crashes.
- **PostHog**: Tracks user funnels (wallet connection, circle creation, invite sharing, contributions, cycle completions, onboarding steps).
- **Supabase**: Persists user feedback ratings and comments.

---

## 📜 On-Chain Smart Contract Details

- **Network**: Stellar Testnet
- **Contract ID**: `CB7QPY4RD2...` (Configured via `VITE_SOROBAN_CONTRACT_ID`)
- **RPC Endpoint**: `https://soroban-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`

---

## ⚡ Setup & Local Development

### Prerequisites
- Node.js (v18+) or Bun
- Rust + `wasm32-unknown-unknown` target (for contract builds)
- Freighter Browser Wallet Extension

### Installation

```bash
# Clone the repository
git clone https://github.com/subhadip890/Rotera.git
cd Rotera

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Running Contract Tests

```bash
cd contracts/rosca
cargo test
```

---

## 📸 Screenshots & Product Demonstrations

- **Product UI**: Clean, warm editorial design with parchment (`#EAE3CF`), ink (`#14213D`), and verdigris (`#2F6E62`) tokens.
- **Roundtable Visualizer**: SVG & Motion interactive seat ring displaying active rotation, seat numbers, and live contribution badges.
- **Mobile Responsive**: Fully responsive layout optimized for mobile viewports and wallet dApp browsers.
- **Monitoring & Analytics**: Integrated Sentry error reporting & PostHog user funnel tracking.

---

## ⚖️ Known Trade-offs & Engineering Decisions

1. **Permissionless Keeper vs Cron Automation**: Since Soroban smart contracts cannot execute autonomously without an external invocation, `close_cycle` relies on a keeper call. Anyone can trigger `close_cycle` after `cycle_deadline` passes.
2. **Shortfall Handling**: If a member misses a contribution cycle, the payout is delivered short by the missed amount, and the shortfall is recorded as debt against that member's future turn.
3. **Early-Exit Protection**: To prevent early-turn recipients from abandoning the circle, a 10% entry deposit is held back until all cycles complete and no debt remains.

---

## 🔗 Submission Checklist & Links

- [x] **Public GitHub Repository**: [github.com/subhadip890/Rotera](https://github.com/subhadip890/Rotera)
- [x] **15+ Meaningful Commits**: Clean Git commit history with conventional commit messages
- [x] **Stellar Testnet Deployment**: Deployed Soroban ROSCA contract
- [x] **Real Wallet Support**: Freighter API & Stellar Wallets Kit integration
- [x] **Analytics & Monitoring**: PostHog funnel tracking + Sentry error capture
- [x] **Feedback Collection**: Supabase-backed feedback widget
- [x] **Mobile Responsive**: Tested across desktop and mobile screens
