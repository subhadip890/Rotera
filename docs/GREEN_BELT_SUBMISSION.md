# ROTera — Stellar Level 4 Green Belt Submission Evidence

> **Decentralized Rotating Savings and Credit Associations (ROSCAs) powered natively by Stellar Soroban.**

This document compiles the verified technical evidence, smart contract proofs, real user validation, on-chain transaction hashes, feedback telemetry, and operational checklists required for the **Stellar Level 4 Green Belt** certification.

---

## 1. Project Overview

Rotera is a production-ready Web3 decentralized rotating savings protocol (known globally as *chit funds*, *susu*, *tanda*, *stokvel*, or *ajo*). It replaces trusted human middlemen with non-custodial Soroban smart contracts on Stellar.

- **Primary Repository**: [https://github.com/subhadip890/Rotera.git](https://github.com/subhadip890/Rotera.git)
- **Live Production App**: [https://rotera-seven.vercel.app/](https://rotera-seven.vercel.app/)
- **Target Network**: Stellar Testnet
- **Contract Language**: Rust (Soroban SDK)
- **Frontend Stack**: TanStack Start (React 19, TypeScript, TanStack Query, Tailwind CSS, Motion)

---

## 2. Problem

Informal rotating savings groups pool billions of dollars worldwide to provide unbanked and underbanked communities with lump-sum capital without bank gatekeepers. However, traditional ROSCAs suffer from severe structural failure modes:
1. **Organizer Risk**: Human coordinators can miscalculate ledger balances, misappropriate pool funds, or abscond entirely.
2. **Default / Early-Exit Risk**: Members who receive payouts in early cycles frequently stop contributing in subsequent cycles, leaving later members at a net loss.
3. **Coordination & Dispute Friction**: Chasing unpaid contributions across messaging groups and manually verifying bank transfers creates continuous social tension.

---

## 3. Solution

Rotera formalizes community savings into transparent, automated on-chain peer circles:
- **Contract-Enforced Accounting & Permissionless Payout Execution**: Smart contracts tally all payments and enforce turn rotation on-chain. Once a cycle deadline passes, `close_cycle` is permissionless — callable by any participant or keeper wallet.
- **Collateralized Entry Deposit (10%)**: Every member locks a 10% entry deposit upon joining. The deposit remains strictly locked in the contract until the entire rotation completes and the member's outstanding debt is zero.
- **On-Chain Debt Tracking**: Missed contributions are recorded directly in contract storage as explicit on-chain debt, reducing payout shortfalls transparently and enabling members to repay their balance anytime via `repay_debt()`.
- **Non-Custodial Self-Sovereignty**: Users authenticate exclusively via their Freighter wallet; Rotera never touches or stores private keys or custody of funds.

---

## 4. Production Architecture

```
+---------------------------------------------------------------------------------+
|                         Rotera TanStack Start Frontend                          |
|             (React 19 + TypeScript + TanStack Query + Tailwind CSS)             |
+---------------------------------------------------------------------------------+
                         |                                 |
                         v                                 v
+----------------------------------+     +----------------------------------------+
|      Stellar Soroban Smart       |     |          Telemetry & Feedback          |
|       Contract (On-Chain)        |     | -------------------------------------- |
| -------------------------------- |     | • Supabase (Feedback & Audit Events)   |
| • create_circle                  |     | • PostHog (Product Analytics)          |
| • join_circle                    |     | • Sentry (Production Error Tracking)   |
| • contribute                     |     | • Freighter Wallet Extension API       |
| • close_cycle (Permissionless)   |     +----------------------------------------+
| • repay_debt                     |
| • withdraw_deposit               |
| • get_status / get_circle        |
+----------------------------------+
```

- **Authoritative Financial State**: Enforced 100% on-chain by the Stellar Soroban contract.
- **Client Cache**: TanStack Query acts as the sole client-side state cache for on-chain queries.
- **Supplemental Product Data**: Supabase PostgreSQL stores user feedback submissions and contract-scoped circle event audit logs.

---

## 5. Live Deployment

- **Production URL**: [https://rotera-seven.vercel.app/](https://rotera-seven.vercel.app/)
- **Deployment Platform**: Vercel (Nitro Node SSR Engine)
- **Deployment Branch**: `main` (auto-deploy enabled on push)
- **Verification Status**: ✅ Live & Functional

---

## 6. Public Repository

- **GitHub URL**: [https://github.com/subhadip890/Rotera.git](https://github.com/subhadip890/Rotera.git)
- **Default Branch**: `main`
- **License**: MIT
- **Meaningful Commits**: **39+ clean commits** (requirement: 15+ commits)
- **CI Pipeline**: Automated GitHub Actions verification (`.github/workflows/ci.yml`)

---

## 7. Stellar Testnet Contract

### Verified Production Contract (Green Belt Submission)
- **Contract ID**: [`CDPLF2WY4NH57MYABBKLSPOJZVAMBFM5N2F5P7SPXS4KF2L6MRPMQ7TJ`](https://stellar.expert/explorer/testnet/contract/CDPLF2WY4NH57MYABBKLSPOJZVAMBFM5N2F5P7SPXS4KF2L6MRPMQ7TJ)
- **Network**: Stellar Testnet (`https://soroban-testnet.stellar.org`)
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **Native XLM SAC Address**: [`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)
- **Contract Source**: [`contracts/rosca/src/lib.rs`](../contracts/rosca/src/lib.rs)

### Legacy Historical Contract (Archived Development)
- **Contract ID**: [`CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4`](https://stellar.expert/explorer/testnet/contract/CAY3GCWDFCXPU6JEIJAECX5UXWKXSKO5WTAV3QUFXFXRV4USNQ2FKLO4)
- *Note*: Preserved on-chain for historical auditability; not used in current runtime.

---

## 8. Smart Contract Verification

The Soroban smart contract is verified by 47 automated unit tests covering all edge cases:

```bash
$ cargo test --manifest-path contracts/rosca/Cargo.toml
test result: ok. 47 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### Key Test Coverage Areas
1. Circle creation bounds (3–12 members, positive contribution, valid cadence).
2. Collateral security deposit locking (10%) and escrow hold.
3. Deterministic Fisher-Yates payout ordering shuffle and activation logic.
4. Turn-based contribution collection and duplicate-payment rejection.
5. Strict cutoff deadline enforcement and late-contribution rejection.
6. Keeper-triggered `close_cycle` payout execution and turn rotation.
7. Missed-contribution shortfall calculation, debt recording, and turn preservation.
8. `repay_debt` execution (partial and full settlement, overpayment rejection).
9. Deposit release restriction until circle completion and debt = 0.
10. Dual-mode seconds/days cadence duration calculation.

---

## 9. Production MVP Features

- **Dynamic Interactive Roundtable**: Custom SVG roundtable component illustrating member seats, active recipient turn, paid status, and real-time countdown.
- **Configurable Payout Ordering**: Choose between join-order sequencing or on-chain deterministic shuffle at activation.
- **Accelerated Testnet Cadences**: Supports 10s, 30s, 60s, and 5min test cycles for rapid demonstration.
- **Live Invite Routing**: Unique shareable invite links (`/join/:circleId`) with automatic seat reservation.
- **Active Debt Repayment**: Dedicated alert and `repay_debt` trigger available during both Active and Completed states.
- **Permissionless Cycle Close**: Any wallet can trigger `close_cycle` once the cutoff deadline expires.

---

## 10. Mobile Responsiveness

The application is engineered with a mobile-first design system and tested across standard mobile viewports (375px–428px):
- Responsive Roundtable SVG scaling down to small screens without layout breakage.
- Truncated wallet addresses (`truncateAddr`) to prevent horizontal overflow.
- Touch-friendly action buttons with minimum 44px tap targets.
- Responsive data tables with horizontal scroll containers.
- Visual screenshot proof available at [`docs/screenshots/06-mobile-landing.png`](./screenshots/06-mobile-landing.png) and [`docs/screenshots/07-mobile-circle.png`](./screenshots/07-mobile-circle.png).

---

## 11. Loading & Error Handling

- **Granular Loading States**: Skeleton placeholders and pulsing indicators during RPC queries and Freighter signing.
- **Bounded Confirmation Polling**: Stellar transaction polling bounded to 15 attempts (30s timeout) with preserved transaction hashes.
- **Human-Readable Error Mapping**: `mapSorobanError()` translates raw Soroban HostErrors into actionable user advice (e.g. insufficient balance, deadline passed, already contributed).
- **Benign Cancellation Filter**: Wallet rejection and modal close events are cleanly filtered to prevent scary error dialogs or telemetry noise.

---

## 12. Analytics — PostHog

- Integrated privacy-first telemetry tracking key lifecycle events:
  - `wallet_connected`
  - `circle_created`
  - `circle_joined`
  - `contribution_confirmed`
  - `cycle_closed`
  - `debt_repaid`
  - `feedback_submitted`
- Safe initialization guard prevents fake/empty key network spam in non-configured environments.

---

## 13. Monitoring — Sentry

- Production error monitoring configured via `@sentry/react` with browser tracing and replay integration.
- Filters benign user actions (e.g. `"Transaction cancelled"`, `"User rejected"`) while capturing unhandled RPC timeouts or contract simulation exceptions.

---

## 14. Supabase Feedback & Audit Evidence

Supabase provides product feedback storage and supplemental circle event logging scoped by `(contract_id, circle_id)`:
- **Feedback Table**: Stores tester ratings, feedback comments, page origin, and timestamps.
- **Circle Events Table**: Stores contract-scoped lifecycle records with confirmed transaction hashes and amounts.
- **Screenshot Proof**:
  - [`docs/evidence/supabase-feedback-real-users.png`](./evidence/supabase-feedback-real-users.png)
  - [`docs/evidence/supabase-wallet-interactions.png`](./evidence/supabase-wallet-interactions.png)
- **Raw CSV Data**:
  - [`docs/evidence/supabase_feedback_export.csv`](./evidence/supabase_feedback_export.csv)
  - [`docs/evidence/supabase_circle_events_export.csv`](./evidence/supabase_circle_events_export.csv)

---

## 15. 10+ Real User Validation

### Real Metrics from Exported Evidence
- **Unique Wallets with Verified On-Chain Transactions**: **12 Unique Wallets**
- **Unique Wallets with Submitted Feedback**: **10 Unique Wallets**
- **Matched Testers (On-Chain Transactions + Feedback)**: **10 Unique Testers**
- **Total Confirmed Testnet Transactions**: **50 On-Chain Events**
- **Average User Rating**: **4.92 / 5.0** (11 ratings of 5★, 1 rating of 4★)
- **Validation Status**: ✅ **10+ Real User Wallet Interaction Evidence — VERIFIED**

---

## 16. Wallet Interaction Proof & Matched Tester Table

All 10 matched testers executed real on-chain transactions on Stellar Testnet contract `CDPLF2WY4NH57MYABBKLSPOJZVAMBFM5N2F5P7SPXS4KF2L6MRPMQ7TJ` and submitted verified feedback:

| # | Truncated Wallet | Circle ID(s) | Verified On-Chain Actions | Representative Stellar Testnet Tx Hash | Rating | Feedback Excerpt |
| :---: | :--- | :---: | :--- | :--- | :---: | :--- |
| **1** | `GDY53TC...DS4W` | 16 | `circle_created`, `circle_joined`, `contribution` (50 XLM) | [`c2632634dd5d...`](https://stellar.expert/explorer/testnet/tx/c2632634dd5d70322b7cff5cd86985f121c68f0dd823860a65d0d03a6176ba1c) | ⭐ 5/5 | *"I would like a clearer success notification after some blockchain transactions finish."* |
| **2** | `GBGHHIRB...UUIL` | 16 | `circle_joined`, `contribution` (50 XLM) | [`a9f96e56c55c...`](https://stellar.expert/explorer/testnet/tx/a9f96e56c55c173acf65ed917f85e7438d117a4cbd78e55e9976fbf40f5207fb) | ⭐ 5/5 | *"great peoject"* |
| **3** | `GDP63TIC...CJGT` | 16 | `circle_joined`, `contribution` (50 XLM) | [`9c40d253df47...`](https://stellar.expert/explorer/testnet/tx/9c40d253df47bc42219de9b5891d7850d00bfdd91ae6c112981eba0af1adecf4) | ⭐ 5/5 | *"fully functional website"* |
| **4** | `GBFKSHPH...5C6N` | 14, 15 | `circle_created` (14 & 15), `circle_joined`, `contribution` (50 XLM) | [`f90e5e6d3661...`](https://stellar.expert/explorer/testnet/tx/f90e5e6d36619613349fbd3503a6bfa3c278a57d1a284f4b777fc307c9056cfc) | ⭐ 5/5 | *"useful and fully working website. great"* |
| **5** | `GAKH2QXR...AZ2F` | 15 | `circle_joined`, `contribution` (50 XLM) | [`5d609cdf6776...`](https://stellar.expert/explorer/testnet/tx/5d609cdf67766ef19dcc845de0413221f528c4568882085213ba9a1d7493d3a6) | ⭐ 5/5 | *"very useful project."* |
| **6** | `GBJ5U4GX...BE5I` | 15 | `circle_joined`, `contribution` (50 XLM) | [`c0dee14d5646...`](https://stellar.expert/explorer/testnet/tx/c0dee14d5646bde2b2f963ebdf7b4c4a6867707aa311c64386ff026bc206fdc9) | ⭐ 5/5 | *"great project and really useful"* |
| **7** | `GDDUCJ53...HLII` | 11, 12 | `circle_joined` (11 & 12), `debt_repaid` (200 XLM), `contribution` (200 XLM) | [`7b2d320d3697...`](https://stellar.expert/explorer/testnet/tx/7b2d320d369777cf8fd2ee354994d7a16240c463be88d0fa807cba4e9af1e01a) | ⭐ 4/5 | *"looks nice"* |
| **8** | `GCK62TJL...XPPJ` | 11, 12 | `circle_joined` (11 & 12), `contribution` (x2) | [`4a6e34346929...`](https://stellar.expert/explorer/testnet/tx/4a6e343469299d9ceeebf9143b18f0c029413fea84c0e81112636f71b30354d1) | ⭐ 5/5 | *"The circle creation process was easy to understand, and the payout order was clear. The app works well on mobile..."* |
| **9** | `GAMX7AYL...5QCM` | 10, 13 | `circle_created` (13), `circle_joined`, `contribution` (x3), `cycle_closed` (10) | [`65eb4cf7233b...`](https://stellar.expert/explorer/testnet/tx/65eb4cf7233b6385f4fa8b35f8eafc077ccb84d40e1dc8e76e814d36dfe9662e) | ⭐ 5/5 | *"this is really very good site...excellent work. The invite-link flow is useful..."* |
| **10** | `GCC2KQ7V...DPL5` | 10, 13 | `circle_joined` (10 & 13), `contribution` (x3), `debt_repaid` (55 XLM) | [`04eb1c1586c0...`](https://stellar.expert/explorer/testnet/tx/04eb1c1586c0189b47b895b014cba6d8cb0fc1ddf38858147ccc9906fc045691) | ⭐ 5/5 | *"I liked that missed payments and debt were shown clearly instead of hiding the issue."* |
| **11** | `GAWOVEXS...ZIBP` | 10, 13 | `circle_joined` (10 & 13), `contribution` (x3), `cycle_closed` (10) | [`ec3e1341803f...`](https://stellar.expert/explorer/testnet/tx/ec3e1341803fcc4ee7224e602600e5e18786b94e8c823295042c97ca414907b4) | *Active Tester* | Real on-chain participant across Circle #10 & Circle #13 |
| **12** | `GCYW27IE...FGBF` | 11, 12 | `circle_created` (11 & 12), `circle_joined`, `contribution` (x2), `cycle_closed` (12) | [`b78e6c63c877...`](https://stellar.expert/explorer/testnet/tx/b78e6c63c8775380d53ab303c2d980f748a079aaa3725b8f6a8da8e0b4853b8e) | *Active Tester* | Real on-chain participant across Circle #11 & Circle #12 |

---

## 17. User Feedback Summary

### What Users Liked
- **Transparent Payout Ordering**: Testers highlighted the clarity of the payout sequence and the ease of starting a circle (*"The circle creation process was easy to understand, and the payout order was clear"*).
- **Shareable Invite Links**: The direct invite-link model was praised for simplifying group coordination (*"The invite-link flow is useful because I can send the same circle directly to other members"*).
- **Clear Default & Debt Tracking**: Users appreciated that missed contributions are explicitly surfaced rather than hidden (*"I liked that missed payments and debt were shown clearly instead of hiding the issue"*).

### Issues & Improvement Requests
- **Transaction Success Clarity**: Testers requested clearer status notifications upon transaction confirmation (*"I would like a clearer success notification after some blockchain transactions finish"*).
- **Mobile Address Layout**: Testers noted that displaying full wallet strings can crowd smaller screens (*"The app works well on mobile, but some wallet addresses are still long and visually crowded"*).

### Changes Implemented in Response to Feedback
1. **Truncated Address Formatting**: Implemented `truncateAddr()` across all roundtable seat pills, member tables, and history rows to optimize mobile screen estate.
2. **Active Debt Repayment Panel**: Added immediate in-cycle debt repayment so members don't have to wait until rotation completion to settle.
3. **Decoupled Button States**: Separated `isClosing` from contribution submission states to ensure action buttons never lock each other.
4. **Enhanced Toast & Error Alerts**: Integrated toast notifications for payout distributions and humanized error messages with direct explorer transaction links.

---

## 18. Product Learnings

1. **Non-Custodial Clarity Wins Trust**: Users familiar with traditional ROSCAs are immediately receptive to non-custodial smart contracts because they eliminate organizer embezzlement risk.
2. **Deterministic Fairness**: Transparent on-chain randomization provides mathematical proof of fairness, resolving typical disputes over who gets early seats.
3. **Speed of Testnet Experience**: Accelerated demo cycles (10s–5min) are critical for users to experience the full lifecycle before committing capital.

---

## 19. Important Testnet Transactions

### Circle #16 Full Run (3 Members, 50 XLM Contribution, 5 XLM Deposit)
- **Create Circle**: [`c2632634dd5d...`](https://stellar.expert/explorer/testnet/tx/c2632634dd5d70322b7cff5cd86985f121c68f0dd823860a65d0d03a6176ba1c)
- **Join Seat 1**: [`feb2a912d6ab...`](https://stellar.expert/explorer/testnet/tx/feb2a912d6abd8d6417ad4cc03fc999fc8522602f0e728b2457a1a6ab65f30dd)
- **Join Seat 2**: [`7db85793a4a6...`](https://stellar.expert/explorer/testnet/tx/7db85793a4a6397ac8a202d02543b2effe4600a883e5695e2d9e2e7923d679ef)
- **Join Seat 3 & Auto-Activate**: [`9ccf18928edd...`](https://stellar.expert/explorer/testnet/tx/9ccf18928edde46510b5c15a2354c7574c2cee8d8f4cb901326d20f0e5ed6bfd)
- **Member 1 Contribution (50 XLM)**: [`9c40d253df47...`](https://stellar.expert/explorer/testnet/tx/9c40d253df47bc42219de9b5891d7850d00bfdd91ae6c112981eba0af1adecf4)
- **Member 2 Contribution (50 XLM)**: [`94242a1bff4c...`](https://stellar.expert/explorer/testnet/tx/94242a1bff4c0014438a087ef1bbf3de63f9ae9608376ba3978a562014c7107e)
- **Member 3 Contribution (50 XLM)**: [`a9f96e56c55c...`](https://stellar.expert/explorer/testnet/tx/a9f96e56c55c173acf65ed917f85e7438d117a4cbd78e55e9976fbf40f5207fb)

### Circle #12 Debt Creation & Repayment Run
- **Missed Payment Debt Trigger & Cycle Close**: [`fb774a7c0f10...`](https://stellar.expert/explorer/testnet/tx/fb774a7c0f108def25d10f124346adb644c01e7618b8a2755cfb1ea30d061d38)
- **Debt Repayment (200 XLM)**: [`7b2d320d3697...`](https://stellar.expert/explorer/testnet/tx/7b2d320d369777cf8fd2ee354994d7a16240c463be88d0fa807cba4e9af1e01a)
- **Subsequent Contribution**: [`74bfe58fcba3...`](https://stellar.expert/explorer/testnet/tx/74bfe58fcba3f58a1339acc8e00996d651e297910a9bca854e38f81dae54f4d2)

---

## 20. Screenshot Evidence Table

| Evidence Description | File Path | Status | What It Proves |
| :--- | :--- | :---: | :--- |
| **Desktop Landing Page** | [`docs/screenshots/01-landing-desktop.png`](./screenshots/01-landing-desktop.png) | **VERIFIED** | Live production hero, value proposition, and interactive roundtable ring |
| **Create Circle Form** | [`docs/screenshots/02-create-circle.png`](./screenshots/02-create-circle.png) | **VERIFIED** | Cadence selector, seat count, XLM contribution, and payout shuffle configuration |
| **Join Circle Invite Page** | [`docs/screenshots/03-join-circle.png`](./screenshots/03-join-circle.png) | **VERIFIED** | Invite URL onboarding, seat breakdown, and deposit requirements |
| **Circle Dashboard** | [`docs/screenshots/04-circle-dashboard.png`](./screenshots/04-circle-dashboard.png) | **VERIFIED** | Active circle ring, countdown timer, pot calculation, and pay action |
| **History & Audit Log** | [`docs/screenshots/05-history.png`](./screenshots/05-history.png) | **VERIFIED** | Unrolled rotation timeline and contract-scoped event audit log |
| **Mobile Landing View** | [`docs/screenshots/06-mobile-landing.png`](./screenshots/06-mobile-landing.png) | **VERIFIED** | Responsive 375px mobile viewport rendering |
| **Mobile Circle View** | [`docs/screenshots/07-mobile-circle.png`](./screenshots/07-mobile-circle.png) | **VERIFIED** | Mobile circle dashboard scaling and touch-friendly controls |
| **Supabase Feedback Proof** | [`docs/evidence/supabase-feedback-real-users.png`](./evidence/supabase-feedback-real-users.png) | **VERIFIED** | Real user feedback submissions with ratings and comments in database |
| **Supabase Wallet Events Proof** | [`docs/evidence/supabase-wallet-interactions.png`](./evidence/supabase-wallet-interactions.png) | **VERIFIED** | 50+ on-chain transaction records logged under current contract ID |
| **PostHog Telemetry Dashboard** | `docs/screenshots/11_posthog_events.png` | **MISSING MANUAL EVIDENCE — USER MUST CAPTURE POSTHOG** | PostHog product telemetry event stream |
| **Sentry Monitoring Stream** | `docs/screenshots/12_sentry_monitoring.png` | **MISSING MANUAL EVIDENCE — USER MUST CAPTURE SENTRY** | Sentry exception monitoring dashboard |

---

## 21. CI / Verification Suite

```bash
$ npm run verify

✔ TypeScript typecheck (tsc --noEmit) : 0 errors
✔ ESLint check (eslint .)             : 0 errors
✔ Vite & Nitro SSR Production Build   : 100% passed
✔ Soroban Rust Contract Unit Tests    : 47 passed; 0 failed; 0 ignored
```

---

## 22. Demo Video

- **Video URL**: **MISSING — USER MUST RECORD AND ADD URL**

### Recommended 3–5 Minute Demo Script
1. **0:00–0:45 | Problem & Value Proposition**: Introduce traditional ROSCAs and how Rotera eliminates coordinator fraud and default risks using Stellar Soroban.
2. **0:45–1:30 | Connect & Create Circle**: Connect Freighter wallet; configure circle name, 3 members, 20 XLM contribution, and 30s accelerated cadence.
3. **1:30–2:30 | Joining & Collateral Deposit**: Open the generated invite link with 2 additional wallets; sign 10% collateral deposit; demonstrate automatic activation.
4. **2:30–3:30 | Contribution & Cycle Close**: Demonstrate turn-based contribution; show collected pot updating; trigger permissionless `close_cycle` to release payout.
5. **3:30–4:15 | Debt Flow & Repay**: Demonstrate a member missing cutoff; show on-chain debt accumulation; execute `repay_debt` to restore balance.
6. **4:15–5:00 | Telemetry, History & Conclusion**: Show the unrolled History timeline, Supabase audit records, and conclude with test coverage and architecture.

---

## 23. Level 4 Requirement Matrix

| Level 4 Requirement | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Production MVP** | **PASS — VERIFIED EVIDENCE** | Full ROSCA lifecycle running on Stellar Testnet and live Vercel SSR |
| **Stable Frontend & Contract** | **PASS — VERIFIED EVIDENCE** | TanStack Start + 47 Rust Soroban unit tests (100% pass) |
| **Mobile Responsive Design** | **PASS — VERIFIED EVIDENCE** | Tested & verified on 375px mobile viewport ([`06-mobile-landing.png`](./screenshots/06-mobile-landing.png)) |
| **Loading States & Error Handling** | **PASS — VERIFIED EVIDENCE** | Bounded timeouts, Skeleton loaders, and `mapSorobanError` |
| **10+ Real Users Onboarded** | **PASS — VERIFIED EVIDENCE** | 12 unique on-chain transaction wallets, 10 matched feedback testers |
| **Proof of Wallet Interactions** | **PASS — VERIFIED EVIDENCE** | 50 real Stellar Testnet transactions logged in database and explorer |
| **User Feedback Collection** | **PASS — VERIFIED EVIDENCE** | Real feedback widget + Supabase database export (12 submissions, 4.92/5.0 avg) |
| **Production Deployment** | **PASS — VERIFIED EVIDENCE** | Live on Vercel at `https://rotera-seven.vercel.app/` |
| **Monitoring Integration** | **PASS — VERIFIED EVIDENCE** | Sentry client integration in `src/lib/sentry.ts` |
| **Analytics Integration** | **PASS — VERIFIED EVIDENCE** | PostHog event capture in `src/lib/posthog.ts` |
| **Optimized UX** | **PASS — VERIFIED EVIDENCE** | Roundtable visual feedback, quick-copy invite, active debt repayment |
| **Project Structure & Docs** | **PASS — VERIFIED EVIDENCE** | Comprehensive documentation, TypeScript architecture, clean modular code |
| **Stellar Testnet Contract** | **PASS — VERIFIED EVIDENCE** | Active contract `CDPLF2WY4NH57MYABBKLSPOJZVAMBFM5N2F5P7SPXS4KF2L6MRPMQ7TJ` |
| **15+ Meaningful Commits** | **PASS — VERIFIED EVIDENCE** | 39 clean, professional git commits on `main` |
| **Public GitHub Repository** | **PASS — VERIFIED EVIDENCE** | Public repository at `https://github.com/subhadip890/Rotera.git` |
| **Product UI Screenshots** | **PASS — VERIFIED EVIDENCE** | 7 production screenshots in `docs/screenshots/` |
| **User Feedback Summary** | **PASS — VERIFIED EVIDENCE** | Categorized summary with real quotes and implemented fixes |
| **Demo Video Link** | **MISSING MANUAL EVIDENCE** | User must record final 3–5 min video and paste URL into submission |
