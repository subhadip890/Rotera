/**
 * Rotera — Stellar Network Configuration
 * Handles network selection, Horizon server, and passphrase.
 */

export const STELLAR_CONFIG = {
  network: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  contractId: import.meta.env.VITE_CONTRACT_ID || '',
} as const

export type NetworkType = 'testnet' | 'mainnet'

/**
 * Check if we're on testnet.
 */
export function isTestnet(): boolean {
  return STELLAR_CONFIG.network === 'testnet'
}
