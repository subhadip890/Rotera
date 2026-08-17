/**
 * soroban.ts
 *
 * Real Soroban RPC integration layer.
 * Builds, simulates, signs and submits actual Stellar/Soroban transactions.
 * No fake data, no setTimeout simulation, no hardcoded tx hashes.
 */

import { trackEvent } from "@/lib/posthog";
import { captureException } from "@/lib/sentry";
import { recordCircleEventToSupabase } from "@/lib/supabase";
import {
  connectFreighter,
  signStellarTx,
  submitAndConfirmTransaction,
  WalletConnectionError,
} from "@/lib/stellar";

// ─── Config ────────────────────────────────────────────────────────────────

const SOROBAN_RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

const CONTRACT_ID = import.meta.env.VITE_SOROBAN_CONTRACT_ID || "";

const NETWORK_PASSPHRASE =
  import.meta.env.VITE_SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

// Native XLM asset contract on Testnet (56 chars, ends with YSC)
const NATIVE_TOKEN_ADDRESS = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Frontend-friendly representation of on-chain MemberState */
export interface OnChainMember {
  address: string;
  paid_deposit: boolean;
  deposit_amount: bigint;
  total_contributed: bigint;
  missed_cycles: number;
  debt: bigint;
  payout_position: number;
  has_received_payout: boolean;
  deposit_withdrawn: boolean;
}

/** Frontend-friendly cycle record */
export interface OnChainCycle {
  cycle_number: number;
  recipient: string;
  amount_paid_out: bigint;
  closed: boolean;
  closed_at: number;
  debt_charged?: boolean;
  contributions: Map<string, boolean>;
}

/** Frontend-friendly circle state decoded from the contract */
export interface OnChainCircle {
  id: bigint;
  name: string;
  organizer: string;
  contribution_amount: bigint;
  deposit_amount: bigint;
  cycle_length_days: number;
  member_count: number;
  status: "Filling" | "Active" | "Completed";
  current_cycle: number;
  cycle_deadline: number;
  payout_order_type: "Manual" | "RandomPending";
  payout_order: string[];
  member_states: Map<string, OnChainMember>;
  cycles: OnChainCycle[];
  created_at: number;
  activated_at: number;
  randomness_seed: string;
  xlm_token: string;
}

// ─── Low-level RPC helpers ──────────────────────────────────────────────────

async function simulateTransaction(txXdr: string, label?: string): Promise<any> {
  if (import.meta.env.DEV && label) {
    console.log(`[Soroban] simulateTransaction → ${label}`);
  }
  const res = await fetch(SOROBAN_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "simulateTransaction",
      params: { transaction: txXdr },
    }),
  });
  if (!res.ok) throw new Error(`RPC HTTP error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`simulateTransaction error: ${JSON.stringify(data.error)}`);
  if (import.meta.env.DEV && data.result?.error) {
    console.error(`[Soroban] simulateTransaction FAILED (${label}):`, data.result.error);
  }
  return data.result;
}

async function getAccount(publicKey: string): Promise<{ sequence: string }> {
  const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Account ${publicKey} not found on Testnet. Fund it first at https://friendbot.stellar.org/?addr=${publicKey}`,
      );
    }
    throw new Error(`Horizon HTTP error: ${res.status}`);
  }
  return res.json();
}

// ─── XDR Building with @stellar/stellar-sdk ────────────────────────────────
// We use dynamic import to avoid SSR issues and ensure the browser build works.

async function getSdk() {
  // @stellar/stellar-sdk is a browser-compatible ESM package
  const sdk = await import("@stellar/stellar-sdk");
  return sdk;
}

/**
 * Build a contract invocation transaction XDR.
 * Simulates it to get the fees & footprint, then returns the assembled XDR ready for signing.
 */
async function buildContractTx(
  method: string,
  args: any[],
  sourcePublicKey: string,
): Promise<string> {
  const sdk = await getSdk();
  const { Contract, TransactionBuilder, Networks, BASE_FEE, xdr, SorobanDataBuilder } = sdk;

  if (
    !CONTRACT_ID ||
    CONTRACT_ID.length !== 56 ||
    !CONTRACT_ID.startsWith("C") ||
    CONTRACT_ID.includes("TESTNET")
  ) {
    throw new Error(
      "Smart contract is not deployed yet or VITE_SOROBAN_CONTRACT_ID is invalid. Run 'node contracts/deploy.mjs' to deploy to Testnet.",
    );
  }

  const account = await getAccount(sourcePublicKey);
  const contract = new Contract(CONTRACT_ID);

  const builtTx = new TransactionBuilder(new sdk.Account(sourcePublicKey, account.sequence), {
    fee: "1000000", // 0.1 XLM max fee; simulation will set actual
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  // Simulate to get auth + soroban data
  const simResult = await simulateTransaction(builtTx.toXDR(), method);

  if (simResult.error) {
    throw new Error(`Contract simulation failed: ${simResult.error}`);
  }

  if (!simResult.results?.[0]?.xdr && !simResult.result) {
    throw new Error(`Simulation returned no result for ${method}`);
  }

  // Assemble the transaction with simulation auth and footprint
  const assembledTx = sdk.rpc?.assembleTransaction
    ? sdk.rpc.assembleTransaction(builtTx, simResult).build()
    : builtTx;

  return assembledTx.toXDR();
}

// ─── Contract function helpers ──────────────────────────────────────────────

async function scStringToBytes(sdk: any, text: string): Promise<any> {
  const bytes = new TextEncoder().encode(text);
  return sdk.xdr.ScVal.scvBytes(bytes);
}

function scAddress(sdk: any, address: string): any {
  let target = address;
  if (!target || target.length !== 56) {
    try {
      target = sdk.Asset.native().contractId(NETWORK_PASSPHRASE);
    } catch {
      target = NATIVE_TOKEN_ADDRESS;
    }
  }
  return new sdk.Address(target).toScVal();
}

function scU32(sdk: any, n: number): any {
  return sdk.xdr.ScVal.scvU32(n);
}

function scI128(sdk: any, n: bigint): any {
  const i128 = new sdk.XdrLargeInt("i128", n);
  return i128.toScVal();
}

function scU64(sdk: any, n: bigint): any {
  return sdk.nativeToScVal(n, { type: "u64" });
}

function scBool(sdk: any, b: boolean): any {
  return sdk.xdr.ScVal.scvBool(b);
}

function scEnum(sdk: any, variant: string, field?: any): any {
  // Soroban contracttype enum is represented as a map with a single key
  return sdk.xdr.ScVal.scvVec([sdk.xdr.ScVal.scvSymbol(variant)]);
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Query on-chain circle state.
 * Returns null if circle not found or contract not configured.
 */
export async function getCircleStateOnChain(
  circleId: string | number,
): Promise<OnChainCircle | null> {
  if (
    !CONTRACT_ID ||
    CONTRACT_ID.length !== 56 ||
    !CONTRACT_ID.startsWith("C") ||
    CONTRACT_ID.includes("TESTNET")
  ) {
    return null;
  }

  try {
    const sdk = await getSdk();
    const numId = BigInt(circleId);

    // Call get_status(circle_id: u64) as a read-only simulation.
    // SIM_ACCOUNT is a well-known, funded Stellar Foundation account used ONLY
    // as the source for read-only simulation transactions. It NEVER signs user
    // transactions or holds user funds. This is the standard Soroban pattern
    // for read operations where a funded source account is required by the SDK.
    // Override with VITE_SOROBAN_SIM_ACCOUNT if needed.
    const SIM_ACCOUNT =
      (import.meta.env["VITE_SOROBAN_SIM_ACCOUNT"] as string | undefined) ||
      "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H";
    const contract = new sdk.Contract(CONTRACT_ID);
    const account = await getAccount(SIM_ACCOUNT).catch(() => ({ sequence: "0" }));

    const dummyTx = new sdk.TransactionBuilder(new sdk.Account(SIM_ACCOUNT, account.sequence), {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_status", sdk.nativeToScVal(numId, { type: "u64" })))
      .setTimeout(300)
      .build();

    const res = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: { transaction: dummyTx.toXDR() },
      }),
    });

    const data = await res.json();

    if (data?.result?.error || !data?.result?.results?.[0]?.xdr) {
      return null;
    }

    const resultXdr = data.result.results[0].xdr;
    const scVal = sdk.xdr.ScVal.fromXDR(resultXdr, "base64");
    return decodeCircleState(sdk, scVal);
  } catch (err) {
    console.warn("[Soroban getCircleState error]:", err);
    captureException(err, { context: "getCircleStateOnChain", circleId });
    return null;
  }
}

/**
 * Helper to defensively decode unit-variant Rust enums (e.g. CircleStatus, PayoutOrderType)
 * from whatever shape @stellar/stellar-sdk scValToNative produces:
 * - array with symbol: ["Active"] -> "Active"
 * - plain string: "Active" -> "Active"
 * - tag object: { tag: "Active" } -> "Active"
 * - unit object: { Active: null } / { Active: void 0 } -> "Active"
 */
export function decodeEnumVariant(val: any, fallback: string): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val) && typeof val[0] === "string") return val[0];
  if (val && typeof val === "object") {
    if (typeof val.tag === "string") return val.tag; // some SDK versions / formats
    const keys = Object.keys(val);
    if (keys.length > 0 && typeof keys[0] === "string") return keys[0];
  }
  return fallback;
}

/**
 * Decode a Soroban CircleState ScVal into our OnChainCircle type.
 */
function decodeCircleState(sdk: any, scVal: any): OnChainCircle | null {
  try {
    const native = sdk.scValToNative(scVal);
    if (!native || typeof native !== "object") return null;

    const statusKey = decodeEnumVariant(native.status, "Filling");
    const orderTypeKey = decodeEnumVariant(native.payout_order_type, "Manual");

    const memberStates = new Map<string, OnChainMember>();
    if (native.member_states) {
      for (const [addr, ms] of Object.entries<any>(native.member_states)) {
        memberStates.set(addr, {
          address: addr,
          paid_deposit: ms.paid_deposit ?? false,
          deposit_amount: BigInt(ms.deposit_amount ?? 0),
          total_contributed: BigInt(ms.total_contributed ?? 0),
          missed_cycles: Number(ms.missed_cycles ?? 0),
          debt: BigInt(ms.debt ?? 0),
          payout_position: Number(ms.payout_position ?? 0),
          has_received_payout: ms.has_received_payout ?? false,
          deposit_withdrawn: ms.deposit_withdrawn ?? false,
        });
      }
    }

    const cycles: OnChainCycle[] = (native.cycles || []).map((c: any) => ({
      cycle_number: Number(c.cycle_number),
      recipient: c.recipient?.toString() || "",
      amount_paid_out: BigInt(c.amount_paid_out ?? 0),
      closed: c.closed ?? false,
      closed_at: Number(c.closed_at ?? 0),
      debt_charged: c.debt_charged ?? false,
      contributions: new Map(Object.entries(c.contributions || {})),
    }));

    // Decode name from bytes
    let name = "";
    try {
      if (native.name instanceof Uint8Array) {
        name = new TextDecoder().decode(native.name);
      } else if (typeof native.name === "string") {
        name = native.name;
      }
    } catch {
      name = "Circle";
    }

    return {
      id: BigInt(native.id ?? 0),
      name,
      organizer: native.organizer?.toString() || "",
      contribution_amount: BigInt(native.contribution_amount ?? 0),
      deposit_amount: BigInt(native.deposit_amount ?? 0),
      cycle_length_days: Number(native.cycle_length_days ?? 7),
      member_count: Number(native.member_count ?? 0),
      status: statusKey as "Filling" | "Active" | "Completed",
      current_cycle: Number(native.current_cycle ?? 0),
      cycle_deadline: Number(native.cycle_deadline ?? 0),
      payout_order_type: orderTypeKey as "Manual" | "RandomPending",
      payout_order: (native.payout_order || []).map((a: any) => a.toString()),
      member_states: memberStates,
      cycles,
      created_at: Number(native.created_at ?? 0),
      activated_at: Number(native.activated_at ?? 0),
      randomness_seed: "",
      xlm_token: native.xlm_token?.toString() || NATIVE_TOKEN_ADDRESS,
    };
  } catch (err) {
    console.error("[decodeCircleState error]:", err);
    return null;
  }
}

/**
 * Create a circle on-chain.
 * Returns the circle ID (u64) and transaction hash.
 */
export async function submitCreateCircle(params: {
  name: string;
  contributionAmount: bigint;
  cycleLengthDays: number;
  memberCount: number;
  payoutOrderType: "Manual" | "RandomPending";
}): Promise<{ circleId: string; txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [
    scAddress(sdk, userAddress),
    await scStringToBytes(sdk, params.name),
    scI128(sdk, params.contributionAmount),
    scU32(sdk, params.cycleLengthDays),
    scU32(sdk, params.memberCount),
    scEnum(sdk, params.payoutOrderType),
    scAddress(sdk, NATIVE_TOKEN_ADDRESS),
  ];

  const txXdr = await buildContractTx("create_circle", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  // Retrieve the actual on-chain circle ID from the transaction result or contract storage
  const circleId = await getCircleIdFromTxHash(txHash, sdk, userAddress);

  trackEvent("circle_created", {
    circle_id: circleId,
    contribution_amount: params.contributionAmount.toString(),
    member_count: params.memberCount,
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: circleId,
    event_type: "circle_created",
    wallet_address: userAddress,
    amount_xlm: stroopsToXlm(params.contributionAmount),
    tx_hash: txHash,
    details: { member_count: params.memberCount, cadence_days: params.cycleLengthDays },
  });

  return { circleId, txHash };
}

/**
 * Extract the returned circle ID (u64) from a confirmed create_circle transaction.
 * Checks transaction meta return value, published events, and on-chain contract state.
 */
async function getCircleIdFromTxHash(
  txHash: string,
  sdk: any,
  organizerAddress: string,
): Promise<string> {
  // 1. Polled extraction from Soroban RPC getTransaction meta/events
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(SOROBAN_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: { hash: txHash },
        }),
      });
      const data = await res.json();
      const resultMetaXdr = data?.result?.resultMetaXdr;

      if (resultMetaXdr) {
        const meta = sdk.xdr.TransactionMeta.fromXDR(resultMetaXdr, "base64");
        const arm = typeof meta.arm === "function" ? meta.arm() : "";
        const metaVal =
          arm === "v4"
            ? meta.v4()
            : arm === "v3"
              ? meta.v3()
              : typeof (meta as any).value === "function"
                ? (meta as any).value()
                : null;

        const sorobanMeta =
          metaVal && typeof metaVal.sorobanMeta === "function" ? metaVal.sorobanMeta() : null;

        // Try direct return value ScVal
        const returnValScVal = sorobanMeta?.returnValue ? sorobanMeta.returnValue() : null;
        if (returnValScVal) {
          const native = sdk.scValToNative(returnValScVal);
          if (native !== undefined && native !== null && String(native) !== "0") {
            return String(native);
          }
        }

        // Try events published by contract during create_circle
        const events = sorobanMeta?.events ? sorobanMeta.events() : [];
        for (const evt of events) {
          try {
            const topics = evt.type ? evt.type().topics() : [];
            if (topics && topics.length >= 2) {
              const topic0 = sdk.scValToNative(topics[0]);
              if (topic0 === "created" || String(topic0) === "created") {
                const circleId = sdk.scValToNative(topics[1]);
                if (circleId !== undefined && circleId !== null) {
                  return String(circleId);
                }
              }
            }
          } catch {
            // keep looking
          }
        }
      }
    } catch (err) {
      console.warn("[getCircleIdFromTxHash attempt error]:", err);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // 2. Fallback: Query contract get_member_circles(organizer) on-chain
  try {
    const circles = await getMemberCirclesOnChain(organizerAddress);
    if (circles.length > 0) {
      const maxId = Math.max(...circles);
      if (maxId > 0) return String(maxId);
    }
  } catch (err) {
    console.warn("[getMemberCirclesOnChain fallback error]:", err);
  }

  // 3. No silent fallback — returning a guessed ID would generate a wrong invite link.
  //    Throw a clear error so the UI can surface it to the user.
  throw new Error(
    "Circle was created on-chain but its ID could not be read back from the transaction. " +
      "Check the transaction on stellar.expert and use the returned circle ID manually, or retry.",
  );
}

/**
 * Helper to query member circle IDs directly from contract storage.
 */
export async function getMemberCirclesOnChain(userAddress: string): Promise<number[]> {
  if (!CONTRACT_ID) return [];
  try {
    const sdk = await getSdk();
    const contract = new sdk.Contract(CONTRACT_ID);
    const dummyTx = new sdk.TransactionBuilder(new sdk.Account(userAddress, "0"), {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_member_circles", scAddress(sdk, userAddress)))
      .setTimeout(300)
      .build();

    const res = await fetch(SOROBAN_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: { transaction: dummyTx.toXDR() },
      }),
    });

    const data = await res.json();
    if (!data?.result?.results?.[0]?.xdr) return [];
    const scVal = sdk.xdr.ScVal.fromXDR(data.result.results[0].xdr, "base64");
    const native = sdk.scValToNative(scVal);
    if (Array.isArray(native)) {
      return native.map((n: any) => Number(n));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Join a circle on-chain (pays deposit from member wallet to contract).
 */
export async function submitJoinCircle(circleId: string | number): Promise<{ txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [scAddress(sdk, userAddress), sdk.nativeToScVal(BigInt(circleId), { type: "u64" })];

  const txXdr = await buildContractTx("join_circle", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  trackEvent("circle_joined", {
    circle_id: String(circleId),
    address: userAddress,
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: String(circleId),
    event_type: "circle_joined",
    wallet_address: userAddress,
    tx_hash: txHash,
  });

  return { txHash };
}

/**
 * Contribute to the current cycle (transfers XLM from member to contract).
 */
export async function submitContribute(
  circleId: string | number,
  cycleNumber: number,
): Promise<{ txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [scAddress(sdk, userAddress), sdk.nativeToScVal(BigInt(circleId), { type: "u64" })];

  const txXdr = await buildContractTx("contribute", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  trackEvent("contribution_confirmed", {
    circle_id: String(circleId),
    cycle_number: cycleNumber,
    address: userAddress,
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: String(circleId),
    event_type: "contribution",
    wallet_address: userAddress,
    tx_hash: txHash,
    details: { cycle_number: cycleNumber },
  });

  return { txHash };
}

/**
 * Close the current cycle (permissionless keeper — any wallet can call after deadline).
 * Triggers real payout from contract to recipient.
 */
export async function submitCloseCycle(
  circleId: string | number,
  cycleNumber: number,
): Promise<{ txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [
    scAddress(sdk, userAddress), // caller (any address)
    sdk.nativeToScVal(BigInt(circleId), { type: "u64" }),
  ];

  const txXdr = await buildContractTx("close_cycle", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  trackEvent("cycle_closed", {
    circle_id: String(circleId),
    cycle_number: cycleNumber,
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: String(circleId),
    event_type: "cycle_closed",
    wallet_address: userAddress,
    tx_hash: txHash,
    details: { cycle_number: cycleNumber },
  });

  return { txHash };
}

/**
 * Withdraw deposit after circle completion (no debt required).
 */
export async function submitWithdrawDeposit(
  circleId: string | number,
): Promise<{ txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [scAddress(sdk, userAddress), sdk.nativeToScVal(BigInt(circleId), { type: "u64" })];

  const txXdr = await buildContractTx("withdraw_deposit", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  trackEvent("deposit_withdrawn", {
    circle_id: String(circleId),
    address: userAddress,
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: String(circleId),
    event_type: "deposit_withdrawn",
    wallet_address: userAddress,
    tx_hash: txHash,
  });

  return { txHash };
}

// ─── Utility: XLM amount formatting ─────────────────────────────────────────

/** Convert stroops (i128 from contract) to XLM display value */
export function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 10_000_000;
}

/** Convert XLM display value to stroops for contract calls */
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

/**
 * Repay outstanding missed-payment debt on-chain.
 * Transfers real XLM from the member's wallet to the contract, reducing their
 * on-chain debt. Overpayment is rejected by the contract.
 * Once debt reaches 0 the deposit becomes withdrawable (for completed circles).
 */
export async function submitRepayDebt(
  circleId: string | number,
  amountStroops: bigint,
): Promise<{ txHash: string }> {
  const userAddress = await connectFreighter();
  const sdk = await getSdk();

  const args = [
    scAddress(sdk, userAddress),
    sdk.nativeToScVal(BigInt(circleId), { type: "u64" }),
    scI128(sdk, amountStroops),
  ];

  const txXdr = await buildContractTx("repay_debt", args, userAddress);
  const signedXdr = await signStellarTx(txXdr, NETWORK_PASSPHRASE);
  const txHash = await submitAndConfirmTransaction(signedXdr);

  trackEvent("debt_repaid", {
    circle_id: String(circleId),
    address: userAddress,
    amount_stroops: String(amountStroops),
    tx_hash: txHash,
  });

  recordCircleEventToSupabase({
    circle_id: String(circleId),
    event_type: "debt_repaid",
    wallet_address: userAddress,
    amount_xlm: stroopsToXlm(amountStroops),
    tx_hash: txHash,
  });

  return { txHash };
}
