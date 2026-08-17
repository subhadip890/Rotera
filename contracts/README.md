# Rotera — Smart Contract (Soroban/Rust)

## Overview

The ROSCA smart contract manages rotating savings circles on Stellar's Soroban platform. It enforces contribution rules, payout order, missed-payment tracking, and early-exit protection — removing the need for a trusted human organizer.

## Setup

### Prerequisites

- Rust toolchain (`rustup`)
- Soroban CLI: `cargo install --locked stellar-cli --features opt`
- Stellar Testnet account (use Friendbot for funding)

### Build

```bash
cd contracts/rosca
stellar contract build
```

### Test

```bash
cd contracts/rosca
cargo test
```

### Deploy

```bash
# See deploy.sh in this directory
./deploy.sh
```

## Contract Functions

| Function                      | Description                                                                                   | Access                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `create_circle`               | Create a new savings circle (legacy day/sec format)                                           | Organizer                               |
| `create_circle_with_duration` | Create circle with explicit `cycle_duration_seconds` (exact weekly/biweekly/monthly cadences) | Organizer                               |
| `join_circle`                 | Join an existing circle (pays 10% security deposit)                                           | Any member with invite                  |
| `contribute`                  | Pay your share for the current cycle                                                          | Circle member                           |
| `close_cycle`                 | Close the current cycle and release payout (safe retry on zero contributions)                 | Anyone (permissionless, after deadline) |
| `withdraw_deposit`            | Withdraw security deposit after circle completion                                             | Member (with zero debt)                 |
| `repay_debt`                  | Settle missed contribution debt on-chain                                                      | Member with debt                        |
| `get_status`                  | Read current circle state                                                                     | Anyone                                  |
| `get_member_circles`          | List circle IDs for an address                                                                | Anyone                                  |

## Architecture Decision: Permissionless Keeper

Soroban contracts cannot self-trigger. The `close_cycle` function is designed so that **any account** can call it once the cycle deadline has passed. The frontend polls for deadline expiry and calls `close_cycle` automatically, or a lightweight cron (Vercel scheduled function) serves as a fallback keeper.

This is a deliberate trade-off: it means cycles don't close the instant the deadline passes, but within seconds/minutes depending on the caller. The contract validates that the deadline has actually passed before executing. If zero contributions were made in a cycle, the contract extends the deadline and retries the cycle without burning the recipient's payout turn.
