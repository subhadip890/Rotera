export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export async function connectFreighter(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet connection is only supported in browser environment.')
  }
  try {
    const freighter = await import('@stellar/freighter-api')
    const isConnFn = freighter.isConnected || (freighter as any).default?.isConnected
    const getAddrFn = freighter.getAddress || (freighter as any).default?.getAddress

    if (!isConnFn || !getAddrFn) {
      throw new Error('Freighter wallet library not found.')
    }

    const connected = await isConnFn()
    if (!connected) {
      throw new Error('Freighter wallet extension is not installed or enabled in your browser.')
    }

    const result = await getAddrFn()
    if (result?.error) {
      throw new Error(result.error)
    }
    if (!result?.address) {
      throw new Error('Could not retrieve wallet address from Freighter.')
    }
    return result.address
  } catch (err: any) {
    throw new Error(err?.message || 'Freighter wallet extension is not installed or enabled in your browser.')
  }
}

export async function signStellarTx(xdr: string, networkPassphrase?: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet signing is only supported in browser environment.')
  }
  const freighter = await import('@stellar/freighter-api')
  const signTxFn = freighter.signTransaction || (freighter as any).default?.signTransaction
  if (!signTxFn) {
    throw new Error('Freighter wallet signing method unavailable.')
  }
  const signedXdr = await signTxFn(xdr, {
    networkPassphrase: networkPassphrase || 'Test SDF Network ; September 2015',
  })
  if (!signedXdr) {
    throw new Error('Transaction signing was cancelled or rejected.')
  }
  return signedXdr
}
