import { useWallet } from './WalletProvider'
import { truncateAddress, formatCompactAmount } from '../../lib/format'
import { isTestnet } from '../../lib/stellar'

/**
 * WalletPanel — Expanded wallet info panel for the dashboard.
 * Shows address, balance, network, and disconnect option.
 */
function WalletPanel() {
  const { address, isConnected, balance, network, walletName, disconnect } = useWallet()

  if (!isConnected || !address) {
    return null
  }

  return (
    <div className="card p-4 flex flex-col gap-3" id="wallet-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Wallet</h3>
        {walletName && (
          <span className="text-xs text-ink-subtle">{walletName}</span>
        )}
      </div>

      {/* Address */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-verdigris flex-shrink-0" aria-hidden="true" />
        <span className="font-mono text-sm text-ink" title={address}>
          {truncateAddress(address, 6, 6)}
        </span>
        <button
          className="ml-auto text-xs text-verdigris hover:text-brass transition-colors"
          onClick={() => navigator.clipboard.writeText(address)}
          title="Copy full address"
        >
          Copy
        </button>
      </div>

      {/* Balance */}
      {balance && (
        <div className="flex items-center justify-between py-2 border-t border-ink-subtle/20">
          <span className="text-sm text-ink-muted">Balance</span>
          <span className="font-mono text-sm font-medium text-ink">
            {formatCompactAmount(balance)}
          </span>
        </div>
      )}

      {/* Network */}
      <div className="flex items-center justify-between py-2 border-t border-ink-subtle/20">
        <span className="text-sm text-ink-muted">Network</span>
        <span className={`badge ${isTestnet() ? 'badge-warning' : 'badge-success'}`}>
          {network || 'testnet'}
        </span>
      </div>

      {/* Disconnect */}
      <button
        className="btn-ghost text-rust-signal hover:bg-rust-light w-full justify-center mt-1"
        onClick={disconnect}
        id="wallet-disconnect-panel-btn"
      >
        Disconnect
      </button>
    </div>
  )
}

export default WalletPanel
