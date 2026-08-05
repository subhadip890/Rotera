/**
 * Rotera — Contract Client
 * TypeScript wrappers around the Soroban ROSCA contract functions.
 * Uses @stellar/stellar-sdk for transaction building and submission.
 */

import { STELLAR_CONFIG } from './stellar'

// ─── Types mirroring the contract ─────────────────────────────────────────

export type CircleStatus = 'Filling' | 'Active' | 'Completed'
export type PayoutOrderType = 'Manual' | 'RandomPending'
export type Asset = 'XLM' | 'USDC'

export interface MemberState {
  address: string
  hasPaidDeposit: boolean
  depositAmount: bigint
  totalContributed: bigint
  missedCycles: number
  debt: bigint
  payoutPosition: number
  hasReceivedPayout: boolean
}

export interface CycleRecord {
  cycleNumber: number
  recipient: string
  contributions: Record<string, boolean>
  amountPaidOut: bigint
  closed: boolean
  closedAt: number
}

export interface CircleState {
  id: string
  name: string
  organizer: string
  contributionAmount: bigint
  cycleLengthDays: number
  memberCount: number
  depositAmount: bigint
  status: CircleStatus
  currentCycle: number
  cycleDeadline: number
  payoutOrderType: PayoutOrderType
  payoutOrder: string[]
  memberStates: MemberState[]
  cycles: CycleRecord[]
  createdAt: number
  activatedAt: number
}

// ─── Formatting helpers for XLM amounts (7 decimal places) ────────────────

export const XLM_DECIMALS = 7
export const XLM_FACTOR = BigInt(10 ** XLM_DECIMALS)

export function toContractAmount(displayAmount: number): bigint {
  return BigInt(Math.round(displayAmount * 10 ** XLM_DECIMALS))
}

export function fromContractAmount(contractAmount: bigint): number {
  return Number(contractAmount) / 10 ** XLM_DECIMALS
}

// ─── Contract client ───────────────────────────────────────────────────────

/**
 * ContractClient — wraps all Soroban contract calls.
 *
 * ARCHITECTURE NOTE:
 * Real contract calls require the user's wallet to sign transactions.
 * This client builds the transaction, passes it to the connected wallet
 * for signing, then submits via Horizon.
 *
 * For now, these are stubs that will be wired to the real contract
 * in Commit 10 (testnet deployment). The UI uses demo data until then.
 */
export class ContractClient {
  private contractId: string

  constructor() {
    this.contractId = STELLAR_CONFIG.contractId
  }

  /**
   * Get circle status — read-only, no signing needed.
   */
  async getStatus(circleId: string): Promise<CircleState | null> {
    if (!this.contractId) {
      console.warn('ContractClient: No contract ID configured — using demo data')
      return null
    }
    try {
      const response = await fetch(
        `${STELLAR_CONFIG.horizonUrl}/contracts/${this.contractId}/data?key=circle_${circleId}`
      )
      if (!response.ok) return null
      // Parse Soroban contract data from Horizon response
      // (full parsing implemented once contract is deployed)
      return null
    } catch (err) {
      console.error('ContractClient.getStatus error:', err)
      return null
    }
  }

  /**
   * Check if a cycle's deadline has passed and close it.
   * This is the permissionless keeper call — anyone can trigger it.
   */
  shouldCloseCycle(circle: CircleState): boolean {
    if (circle.status !== 'Active') return false
    const now = Math.floor(Date.now() / 1000)
    return now >= circle.cycleDeadline
  }

  /**
   * Build a display-friendly circle ID from a raw circle ID number.
   */
  formatCircleId(id: number): string {
    return `ROTERA-${id.toString(36).toUpperCase().padStart(6, '0')}`
  }

  /**
   * Parse a circle ID string back to number.
   */
  parseCircleId(code: string): number {
    const raw = code.replace('ROTERA-', '')
    return parseInt(raw, 36)
  }
}

export const contractClient = new ContractClient()

// ─── Demo data factory ─────────────────────────────────────────────────────
// Used when contract is not yet deployed or for onboarding demos.

export function createDemoCircle(overrides: Partial<CircleState> = {}): CircleState {
  const members = [
    'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDE',
    'GBCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEF',
    'GCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFG',
    'GDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH',
    'GEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHI',
  ]
  return {
    id: 'ROTERA-000001',
    name: 'Friday Friends Fund',
    organizer: members[0],
    contributionAmount: toContractAmount(50),
    cycleLengthDays: 7,
    memberCount: 5,
    depositAmount: toContractAmount(5),
    status: 'Active',
    currentCycle: 2,
    cycleDeadline: Math.floor(Date.now() / 1000) + 3 * 86400, // 3 days from now
    payoutOrderType: 'Manual',
    payoutOrder: members,
    memberStates: members.map((addr, i) => ({
      address: addr,
      hasPaidDeposit: true,
      depositAmount: toContractAmount(5),
      totalContributed: toContractAmount(i < 3 ? 100 : 50), // some have 2 cycles, some 1
      missedCycles: i === 4 ? 1 : 0,
      debt: i === 4 ? toContractAmount(50) : 0n,
      payoutPosition: i,
      hasReceivedPayout: i === 0, // first member already received
    })),
    cycles: [
      {
        cycleNumber: 1,
        recipient: members[0],
        contributions: Object.fromEntries(members.map(m => [m, true])),
        amountPaidOut: toContractAmount(250),
        closed: true,
        closedAt: Math.floor(Date.now() / 1000) - 8 * 86400,
      },
      {
        cycleNumber: 2,
        recipient: members[1],
        contributions: Object.fromEntries(members.map((m, i) => [m, i < 3])), // 3 of 5 paid
        amountPaidOut: 0n,
        closed: false,
        closedAt: 0,
      },
    ],
    createdAt: Math.floor(Date.now() / 1000) - 20 * 86400,
    activatedAt: Math.floor(Date.now() / 1000) - 14 * 86400,
    ...overrides,
  }
}
