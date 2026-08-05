/**
 * Rotera — Formatting Helpers
 * Utilities for displaying amounts, addresses, dates, and cycle data
 * in a consistent, user-friendly format.
 */

/**
 * Truncate a Stellar public address for display.
 * "GABCD...WXYZ" format with configurable prefix/suffix length.
 */
export function truncateAddress(address: string, prefixLen = 4, suffixLen = 4): string {
  if (!address || address.length <= prefixLen + suffixLen + 3) return address
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`
}

/**
 * Format an XLM or USDC amount with proper decimals.
 * Uses 7 decimal places for XLM (Stellar standard), 2 for USDC.
 */
export function formatAmount(
  amount: string | number,
  asset: 'XLM' | 'USDC' = 'XLM',
  compact = false
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'

  const decimals = asset === 'USDC' ? 2 : compact ? 2 : 7
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: compact ? 0 : decimals,
    maximumFractionDigits: decimals,
  })

  return `${formatted} ${asset}`
}

/**
 * Format a compact amount (no trailing zeros, just 2 decimals).
 */
export function formatCompactAmount(amount: string | number, asset: 'XLM' | 'USDC' = 'XLM'): string {
  return formatAmount(amount, asset, true)
}

/**
 * Format a cycle countdown (remaining seconds to deadline).
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Cycle ended'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

/**
 * Format a date for display in the history timeline.
 */
export function formatDate(timestamp: number | string): string {
  const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a relative time string ("2 hours ago", "just now").
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(timestamp)
}

/**
 * Generate a cycle label: "Cycle 3 of 6"
 */
export function formatCycleLabel(current: number, total: number): string {
  return `Cycle ${current} of ${total}`
}

/**
 * Calculate circle progress percentage.
 */
export function circleProgress(currentCycle: number, totalCycles: number): number {
  if (totalCycles <= 0) return 0
  return Math.min(100, Math.round((currentCycle / totalCycles) * 100))
}

/**
 * Generate an invite link from a circle ID.
 */
export function generateInviteLink(circleId: string): string {
  const baseUrl = window.location.origin
  return `${baseUrl}/join/${circleId}`
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
