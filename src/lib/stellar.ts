export type WalletError =
  | 'NOT_INSTALLED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'WRONG_NETWORK'
  | 'UNKNOWN';

export class WalletConnectionError extends Error {
  code: WalletError;
  constructor(code: WalletError, message: string) {
    super(message);
    this.code = code;
    this.name = 'WalletConnectionError';
  }
}

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const SOROBAN_RPC_URL =
  import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';

/**
 * Connect to the Freighter wallet and return the public key.
 * Throws WalletConnectionError on any failure — never falls back to a fake address.
 */
export async function connectFreighter(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new WalletConnectionError('NOT_INSTALLED', 'Wallet connection requires a browser.');
  }

  let freighter: any;
  try {
    freighter = await import('@stellar/freighter-api');
  } catch {
    throw new WalletConnectionError(
      'NOT_INSTALLED',
      'Freighter library could not be loaded. Make sure the extension is installed.',
    );
  }

  const isConnFn = freighter.isConnected ?? freighter.default?.isConnected;
  const getAddrFn = freighter.getAddress ?? freighter.default?.getAddress;

  if (!isConnFn || !getAddrFn) {
    throw new WalletConnectionError(
      'NOT_INSTALLED',
      'Freighter wallet extension is not installed or enabled.',
    );
  }

  let connected: boolean;
  try {
    const result = await isConnFn();
    // Freighter API v6 returns { isConnected: boolean } or boolean
    connected = typeof result === 'object' ? result.isConnected : result;
  } catch {
    throw new WalletConnectionError(
      'NOT_INSTALLED',
      'Freighter is not installed. Download it from freighter.app.',
    );
  }

  if (!connected) {
    throw new WalletConnectionError(
      'NOT_INSTALLED',
      'Freighter is not installed or not enabled. Download it from freighter.app.',
    );
  }

  let addrResult: any;
  try {
    addrResult = await getAddrFn();
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('cancel') || msg.includes('reject') || msg.includes('denied')) {
      throw new WalletConnectionError('REJECTED', 'Freighter connection was rejected by the user.');
    }
    throw new WalletConnectionError('UNKNOWN', msg || 'Freighter returned an unexpected error.');
  }

  if (addrResult?.error) {
    const errStr = String(addrResult.error).toLowerCase();
    if (errStr.includes('cancel') || errStr.includes('reject')) {
      throw new WalletConnectionError('REJECTED', addrResult.error);
    }
    throw new WalletConnectionError('UNKNOWN', addrResult.error);
  }

  if (!addrResult?.address) {
    throw new WalletConnectionError(
      'REJECTED',
      'Could not retrieve wallet address. Make sure Freighter is unlocked and connected to Testnet.',
    );
  }

  return addrResult.address;
}

/**
 * Check the connected network and warn if not Testnet.
 */
export async function getNetworkDetails(): Promise<{ network: string; passphrase: string } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const freighter = await import('@stellar/freighter-api');
    const getNetworkFn =
      freighter.getNetworkDetails ?? freighter.default?.getNetworkDetails;
    if (!getNetworkFn) return null;
    const result = await getNetworkFn();
    return {
      network: result?.network || result?.networkName || '',
      passphrase: result?.networkPassphrase || result?.passphrase || '',
    };
  } catch {
    return null;
  }
}

/**
 * Sign an XDR transaction with Freighter.
 * Returns signed XDR string. Throws on cancel/reject.
 */
export async function signStellarTx(
  xdr: string,
  networkPassphrase?: string,
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new WalletConnectionError('NOT_INSTALLED', 'Wallet signing requires a browser.');
  }

  const freighter = await import('@stellar/freighter-api');
  const signTxFn = freighter.signTransaction ?? freighter.default?.signTransaction;

  if (!signTxFn) {
    throw new WalletConnectionError('NOT_INSTALLED', 'Freighter signing method unavailable.');
  }

  let result: any;
  try {
    result = await signTxFn(xdr, {
      networkPassphrase: networkPassphrase || TESTNET_PASSPHRASE,
    });
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('cancel') || msg.includes('reject') || msg.includes('denied') || msg.includes('user')) {
      throw new WalletConnectionError('CANCELLED', 'Transaction signing was cancelled by the user.');
    }
    throw new WalletConnectionError('UNKNOWN', err?.message || 'Transaction signing failed.');
  }

  if (!result) {
    throw new WalletConnectionError('CANCELLED', 'Transaction signing was cancelled.');
  }

  // Freighter v6 returns { signedTxXdr: string } or just the XDR string
  return typeof result === 'string' ? result : result.signedTxXdr || result;
}

/**
 * Submit a signed XDR transaction to the Soroban RPC and wait for confirmation.
 * Returns the transaction hash on success. Throws on failure.
 */
export async function submitAndConfirmTransaction(signedXdr: string): Promise<string> {
  const networkPassphrase = import.meta.env.VITE_SOROBAN_NETWORK_PASSPHRASE || TESTNET_PASSPHRASE;

  // Send transaction
  const sendRes = await fetch(SOROBAN_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: { transaction: signedXdr },
    }),
  });

  if (!sendRes.ok) {
    throw new Error(`RPC sendTransaction HTTP error: ${sendRes.status}`);
  }

  const sendData = await sendRes.json();

  if (sendData.error) {
    throw new Error(`sendTransaction RPC error: ${JSON.stringify(sendData.error)}`);
  }

  const txHash = sendData.result?.hash;
  if (!txHash) {
    throw new Error('sendTransaction returned no hash: ' + JSON.stringify(sendData));
  }

  const status = sendData.result?.status;
  if (status === 'ERROR') {
    throw new Error(
      'Transaction rejected by network: ' + (sendData.result?.errorResult || txHash),
    );
  }

  // Poll for confirmation
  const MAX_POLLS = 30;
  const POLL_INTERVAL_MS = 2000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const getRes = await fetch(SOROBAN_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'getTransaction',
        params: { hash: txHash },
      }),
    });

    const getData = await getRes.json();
    const txStatus = getData?.result?.status;

    if (txStatus === 'SUCCESS') {
      return txHash;
    }
    if (txStatus === 'FAILED') {
      const resultXdr = getData?.result?.resultXdr || '';
      throw new Error(`Transaction failed on-chain. Hash: ${txHash}. Result: ${resultXdr}`);
    }
    // PENDING or NOT_FOUND — keep polling
  }

  throw new Error(`Transaction confirmation timeout after ${MAX_POLLS * POLL_INTERVAL_MS / 1000}s. Hash: ${txHash}`);
}
