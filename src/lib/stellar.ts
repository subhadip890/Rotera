import freighterApi from '@stellar/freighter-api'

const { isConnected, getAddress, signTransaction } = freighterApi || {}

export interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export async function connectFreighter(): Promise<string> {
  const checkConnected = isConnected || (freighterApi as any)?.isConnected
  if (!checkConnected) {
    throw new Error('Freighter wallet extension is not installed or enabled in your browser.')
  }
  const connected = await checkConnected()
  if (!connected) {
    throw new Error('Freighter wallet extension is not installed or enabled in your browser.')
  }
  const fetchAddress = getAddress || (freighterApi as any)?.getAddress
  const result = await fetchAddress()
  if (result?.error) {
    throw new Error(result.error)
  }
  if (!result?.address) {
    throw new Error('Could not retrieve wallet address from Freighter.')
  }
  return result.address
}

export async function signStellarTx(xdr: string, networkPassphrase?: string): Promise<string> {
  const signTx = signTransaction || (freighterApi as any)?.signTransaction
  if (!signTx) {
    throw new Error('Freighter wallet signing method unavailable.')
  }
  const signedXdr = await signTx(xdr, {
    networkPassphrase: networkPassphrase || 'Test SDF Network ; September 2015',
  })
  if (!signedXdr) {
    throw new Error('Transaction signing was cancelled or rejected.')
  }
  return signedXdr
}
