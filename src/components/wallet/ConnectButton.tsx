import { useWallet } from './WalletProvider'
import { truncateAddress, formatCompactAmount } from '../../lib/format'

/**
 * ConnectButton — Wallet connection control.
 * Shows "Connect Wallet" when disconnected, shows address + balance when connected.
 * Uses design tokens: brass for CTA, verdigris for connected state, mono for address.
 */
function ConnectButton() {
  const { address, isConnected, isConnecting, balance, disconnect, connect, error, clearError } = useWallet()

  if (isConnecting) {
    return (
      <button
        className="btn-secondary opacity-70 cursor-wait"
        disabled
        aria-busy="true"
        id="wallet-connect-btn"
      >
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Connecting…</span>
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Balance badge */}
        {balance && (
          <span className="badge badge-success font-mono text-xs">
            {formatCompactAmount(balance)}
          </span>
        )}

        {/* Address + disconnect */}
        <div className="relative group">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-chalk border border-verdigris-mid
                       text-ink text-sm font-mono hover:bg-verdigris-light transition-colors duration-150"
            onClick={disconnect}
            id="wallet-disconnect-btn"
            title="Click to disconnect"
          >
            {/* Green dot indicator */}
            <span className="w-2 h-2 rounded-full bg-verdigris flex-shrink-0" aria-hidden="true" />
            <span>{truncateAddress(address)}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="btn-primary"
        onClick={connect}
        id="wallet-connect-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        Connect Wallet
      </button>

      {/* Error message */}
      {error && (
        <button
          className="text-xs text-rust-signal max-w-[200px] text-right hover:underline"
          onClick={clearError}
          title="Click to dismiss"
        >
          {error}
        </button>
      )}
    </div>
  )
}

export default ConnectButton
