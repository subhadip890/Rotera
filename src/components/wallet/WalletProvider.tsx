import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

/** Network type matching Stellar Wallets Kit */
type StellarNetwork = 'TESTNET' | 'PUBLIC'

/** Wallet state exposed to the entire app */
interface WalletState {
  /** Stellar public address (G...) */
  address: string | null
  /** Whether a wallet is currently connected */
  isConnected: boolean
  /** Whether a connection attempt is in progress */
  isConnecting: boolean
  /** XLM balance (string, 7 decimals) */
  balance: string | null
  /** Current network: testnet or public */
  network: StellarNetwork | null
  /** Name of the connected wallet module */
  walletName: string | null
  /** Connect to a wallet */
  connect: () => Promise<void>
  /** Disconnect current wallet */
  disconnect: () => void
  /** Error message from the last operation */
  error: string | null
  /** Clear the current error */
  clearError: () => void
}

const WalletContext = createContext<WalletState | null>(null)

const STORAGE_KEY = 'rotera_wallet_address'

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState<string | null>(null)
  const [network, setNetwork] = useState<StellarNetwork | null>(null)
  const [walletName, setWalletName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isConnected = address !== null

  /** Fetch XLM balance from Horizon */
  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const horizonUrl = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org'
      const res = await fetch(`${horizonUrl}/accounts/${addr}`)
      if (!res.ok) {
        if (res.status === 404) {
          setBalance('0')
          return
        }
        throw new Error('Failed to fetch account')
      }
      const data = await res.json()
      const nativeBalance = data.balances?.find(
        (b: { asset_type: string; balance: string }) => b.asset_type === 'native'
      )
      setBalance(nativeBalance?.balance || '0')
    } catch {
      setBalance(null)
    }
  }, [])

  /** Try to reconnect from persisted state */
  useEffect(() => {
    const savedAddress = localStorage.getItem(STORAGE_KEY)
    if (savedAddress) {
      setAddress(savedAddress)
      setWalletName('Freighter')
      setNetwork('TESTNET')
      fetchBalance(savedAddress)
    }
  }, [fetchBalance])

  /** Connect using Freighter directly (simplest path) */
  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Dynamic import to avoid bundling issues if Freighter isn't installed
      const freighter = await import('@stellar/freighter-api')

      const { address: addr, error: freighterError } = await freighter.requestAccess()

      if (freighterError) {
        throw new Error(freighterError)
      }

      if (!addr) {
        throw new Error('No address returned from wallet. Is Freighter installed and unlocked?')
      }

      setAddress(addr)
      setWalletName('Freighter')
      setNetwork('TESTNET')
      localStorage.setItem(STORAGE_KEY, addr)

      await fetchBalance(addr)
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Could not connect to wallet. Make sure Freighter is installed and try again.'
      setError(message)
      console.error('Wallet connect error:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [fetchBalance])

  /** Disconnect and clear state */
  const disconnect = useCallback(() => {
    setAddress(null)
    setBalance(null)
    setNetwork(null)
    setWalletName(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value: WalletState = {
    address,
    isConnected,
    isConnecting,
    balance,
    network,
    walletName,
    connect,
    disconnect,
    error,
    clearError,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

/** Hook to access wallet state. Must be used within a WalletProvider. */
export function useWallet(): WalletState {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return ctx
}
