#!/usr/bin/env node
/**
 * deploy.mjs
 *
 * Rotera — Windows-compatible Stellar Testnet deployment script.
 * Uses Node.js + @stellar/stellar-sdk to:
 * 1. Fund a deployer account via Friendbot
 * 2. Upload the compiled WASM to Stellar Testnet
 * 3. Deploy the contract
 * 4. Write the contract ID to .env
 *
 * Prerequisites:
 *   - `stellar contract build` has been run in contracts/rosca/
 *   - @stellar/stellar-sdk is installed (npm install)
 *
 * Usage (from repo root):
 *   node contracts/deploy.mjs
 *
 * Or on Unix:
 *   node contracts/deploy.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const WASM_PATH = join(
  __dirname,
  'rosca',
  'target',
  'wasm32-unknown-unknown',
  'release',
  'rotera_rosca.wasm',
);
const ENV_PATH = join(ROOT_DIR, '.env');

const TESTNET_RPC = 'https://soroban-testnet.stellar.org';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';

// ─── Import stellar-sdk ─────────────────────────────────────────────────────
const sdk = await import('@stellar/stellar-sdk');
const { Keypair, TransactionBuilder, Account, BASE_FEE, Operation, xdr, Networks } = sdk;

// ─── Generate a deploy keypair ───────────────────────────────────────────────
console.log('\n🔑  Generating deployer keypair...');
const deployer = Keypair.random();
const deployerPub = deployer.publicKey();
const deployerSecret = deployer.secret();
console.log(`   Public key: ${deployerPub}`);

// ─── Fund via Friendbot ───────────────────────────────────────────────────────
console.log('\n🪂  Funding deployer via Friendbot...');
const fbRes = await fetch(`${FRIENDBOT_URL}?addr=${deployerPub}`);
if (!fbRes.ok) {
  const text = await fbRes.text();
  console.error('❌  Friendbot failed:', text);
  process.exit(1);
}
console.log('   Funded.');

// Small wait for ledger to process
await new Promise((r) => setTimeout(r, 3000));

// ─── Load WASM ───────────────────────────────────────────────────────────────
if (!existsSync(WASM_PATH)) {
  console.error(`\n❌  WASM not found at: ${WASM_PATH}`);
  console.error('   Run: cd contracts/rosca && cargo build --target wasm32-unknown-unknown --release');
  process.exit(1);
}
const wasm = readFileSync(WASM_PATH);
console.log(`\n📦  WASM loaded: ${wasm.length} bytes`);

// ─── Get deployer account ─────────────────────────────────────────────────────
const accRes = await fetch(`${HORIZON_URL}/accounts/${deployerPub}`);
const accData = await accRes.json();
const deployerAccount = new Account(deployerPub, accData.sequence);

// ─── Upload WASM (installContractCode) ───────────────────────────────────────
console.log('\n⬆️   Uploading WASM to Stellar Testnet...');

const uploadTx = new TransactionBuilder(deployerAccount, {
  fee: '1000000',
  networkPassphrase: TESTNET_PASSPHRASE,
})
  .addOperation(
    Operation.uploadContractWasm({ wasm }),
  )
  .setTimeout(300)
  .build();

// Simulate to get soroban data
const simUpload = await rpcPost('simulateTransaction', { transaction: uploadTx.toXDR() });
if (simUpload.error) {
  console.error('❌  Simulation failed:', simUpload.error);
  process.exit(1);
}

const assembledUpload = sdk.rpc?.assembleTransaction
  ? sdk.rpc.assembleTransaction(uploadTx, simUpload).build()
  : uploadTx;

assembledUpload.sign(deployer);
const uploadResult = await rpcPost('sendTransaction', { transaction: assembledUpload.toXDR() });

if (uploadResult.error || uploadResult.status === 'ERROR') {
  console.error('❌  WASM upload failed:', uploadResult);
  process.exit(1);
}

const wasmHash = await waitForTransaction(uploadResult.hash);
const wasmHashBytes = createHash('sha256').update(wasm).digest();
const wasmHashHex = wasmHashBytes.toString('hex');
console.log(`   WASM hash (SHA-256): ${wasmHashHex}`);

// ─── Deploy contract ───────────────────────────────────────────────────────────
console.log('\n🚀  Deploying contract...');

// Re-fetch account for updated sequence
const accRes2 = await fetch(`${HORIZON_URL}/accounts/${deployerPub}`);
const accData2 = await accRes2.json();
const deployerAccount2 = new Account(deployerPub, accData2.sequence);

const deployTx = new TransactionBuilder(deployerAccount2, {
  fee: '1000000',
  networkPassphrase: TESTNET_PASSPHRASE,
})
  .addOperation(
    Operation.createCustomContract({
      address: new sdk.Address(deployerPub),
      wasmHash: wasmHashBytes,
    }),
  )
  .setTimeout(300)
  .build();

const simDeploy = await rpcPost('simulateTransaction', { transaction: deployTx.toXDR() });
if (simDeploy.error) {
  console.error('❌  Deploy simulation failed:', simDeploy.error);
  process.exit(1);
}

const assembledDeploy = sdk.rpc?.assembleTransaction
  ? sdk.rpc.assembleTransaction(deployTx, simDeploy).build()
  : deployTx;

assembledDeploy.sign(deployer);
const deployResult = await rpcPost('sendTransaction', { transaction: assembledDeploy.toXDR() });

if (deployResult.error || deployResult.status === 'ERROR') {
  console.error('❌  Deploy failed:', deployResult);
  process.exit(1);
}

const deployConfirm = await waitForTransaction(deployResult.hash);

// Extract contract ID from diagnostic events or return value
let contractId = 'UNKNOWN';
try {
  if (deployConfirm.diagnosticEventsXdr) {
    for (const evtXdr of deployConfirm.diagnosticEventsXdr) {
      try {
        const evt = sdk.xdr.DiagnosticEvent.fromXDR(evtXdr, 'base64');
        const contractBytes = evt.event().contractId();
        if (contractBytes) {
          contractId = sdk.Address.contract(contractBytes).toString();
          break;
        }
      } catch {
        // continue
      }
    }
  }
} catch (err) {
  console.warn('   Could not extract contract ID:', err.message);
}

// ─── Output ───────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  ✅  Contract deployed to Stellar Testnet                ║');
console.log('╠══════════════════════════════════════════════════════════╣');
console.log(`║  CONTRACT_ID: ${contractId}`);
console.log(`║  TX HASH: ${deployResult.hash}`);
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// ─── Write to .env ─────────────────────────────────────────────────────────────
let envContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf-8') : '';

if (envContent.includes('VITE_SOROBAN_CONTRACT_ID=')) {
  envContent = envContent.replace(
    /^VITE_SOROBAN_CONTRACT_ID=.*$/m,
    `VITE_SOROBAN_CONTRACT_ID=${contractId}`,
  );
} else {
  envContent += `\nVITE_SOROBAN_CONTRACT_ID=${contractId}\n`;
}

writeFileSync(ENV_PATH, envContent);
console.log(`📝  Contract ID written to .env`);
console.log(`   VITE_SOROBAN_CONTRACT_ID=${contractId}`);
console.log('');
console.log('   View on Stellar Expert:');
console.log(`   https://stellar.expert/explorer/testnet/contract/${contractId}`);
console.log('');

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function rpcPost(method, params) {
  const res = await fetch(TESTNET_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const data = await res.json();
  return data.result ?? data;
}

async function waitForTransaction(hash, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const result = await rpcPost('getTransaction', { hash });
    if (result.status === 'SUCCESS') {
      console.log(`   ✅  Confirmed: ${hash}`);
      return result;
    }
    if (result.status === 'FAILED') {
      throw new Error(`Transaction FAILED: ${hash}\n${JSON.stringify(result, null, 2)}`);
    }
    process.stdout.write('.');
  }
  throw new Error(`Transaction timeout after ${maxTries * 2}s: ${hash}`);
}
