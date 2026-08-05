#!/bin/bash
# ============================================================
# Rotera — Testnet Deploy Script
# Builds and deploys the ROSCA Soroban contract to Stellar Testnet.
# Usage: ./contracts/deploy.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACT_DIR="$SCRIPT_DIR/rosca"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔨 Building contract..."
cd "$CONTRACT_DIR"
stellar contract build

WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/rotera_rosca.wasm"

if [ ! -f "$WASM_PATH" ]; then
    echo "❌ WASM not found at: $WASM_PATH"
    exit 1
fi

echo "✅ WASM built: $WASM_PATH"

# ── Fund a deployer account via Friendbot ──────────────────────────────────
echo "🪂 Funding deployer account..."
stellar keys generate deployer --overwrite 2>/dev/null || true
stellar keys fund deployer --network testnet 2>/dev/null || true
DEPLOYER=$(stellar keys address deployer)
echo "   Deployer: $DEPLOYER"

# ── Deploy contract ────────────────────────────────────────────────────────
echo "🚀 Deploying to testnet..."
CONTRACT_ID=$(stellar contract deploy \
    --wasm "$WASM_PATH" \
    --source deployer \
    --network testnet \
    --fee 1000000)

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Contract deployed to Stellar Testnet                ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  CONTRACT_ID: $CONTRACT_ID"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Write contract ID to .env ──────────────────────────────────────────────
ENV_FILE="$ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    # Update existing VITE_CONTRACT_ID line
    if grep -q "^VITE_CONTRACT_ID=" "$ENV_FILE"; then
        sed -i "s|^VITE_CONTRACT_ID=.*|VITE_CONTRACT_ID=$CONTRACT_ID|" "$ENV_FILE"
    else
        echo "VITE_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
    fi
else
    cp "$ROOT_DIR/.env.example" "$ENV_FILE"
    sed -i "s|^VITE_CONTRACT_ID=.*|VITE_CONTRACT_ID=$CONTRACT_ID|" "$ENV_FILE"
fi

echo "📝 Contract ID written to .env"
echo "   VITE_CONTRACT_ID=$CONTRACT_ID"
