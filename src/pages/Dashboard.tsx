import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition } from '../lib/motion'
import Navbar from '../components/layout/Navbar'
import { RoundtableCanvas, RoundtableFallback } from '../components/roundtable'
import { useWallet } from '../components/wallet'
import { createDemoCircle, type CircleState, fromContractAmount } from '../lib/contract'
import { formatCountdown, truncateAddress } from '../lib/format'

// ─── Sub-components ────────────────────────────────────────────────────────

function MemberRow({ address, hasPaid, isLate, isCurrentUser, payoutPosition }: {
  address: string; hasPaid: boolean; isLate: boolean
  isCurrentUser: boolean; payoutPosition: number
}) {
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-ink-subtle/10 last:border-0 ${isCurrentUser ? 'bg-verdigris-light rounded-lg px-2 -mx-2' : ''}`}>
      <span className="font-mono text-xs text-ink-subtle w-5 text-right">{payoutPosition + 1}</span>
      <span className="font-mono text-sm text-ink flex-1 truncate" title={address}>{truncateAddress(address, 5, 5)}</span>
      {payoutPosition === 0 && <span className="badge badge-warning text-xs">Up next</span>}
      {hasPaid
        ? <span className="badge badge-success">Paid</span>
        : isLate
        ? <span className="badge badge-error">Late</span>
        : <span className="badge badge-neutral">Waiting</span>
      }
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse flex flex-col gap-6">
      <div className="h-8 bg-ink-subtle/20 rounded w-48" />
      <div className="card flex flex-col items-center gap-4">
        <div className="w-48 h-48 rounded-full bg-ink-subtle/10" />
        <div className="h-5 bg-ink-subtle/20 rounded w-32" />
      </div>
      <div className="card flex flex-col gap-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-8 bg-ink-subtle/15 rounded" />
        ))}
      </div>
    </div>
  )
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <RoundtableFallback seatCount={6} size={160} className="opacity-30" />
      <h2 className="mt-6 font-display text-2xl font-light text-ink">No circle found</h2>
      <p className="mt-2 text-ink-muted max-w-sm">
        This circle doesn't exist or the link is incorrect.
      </p>
      <div className="flex gap-3 mt-6">
        <Link to="/create" className="btn-primary no-underline">Start a circle</Link>
        <Link to="/join" className="btn-secondary no-underline">Join with invite</Link>
      </div>
    </div>
  )
}

function PayoutSuccessBanner({ recipientAddress, amount, asset }: { recipientAddress: string; amount: string; asset: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl p-5 text-center"
      style={{ background: 'linear-gradient(135deg, var(--brass-light) 0%, rgba(201,151,60,0.1) 100%)', border: '1.5px solid var(--brass)' }}
    >
      <p className="text-xs font-mono text-brass uppercase tracking-widest mb-1">Payout complete</p>
      <p className="text-2xl font-mono font-medium text-brass">{amount} {asset}</p>
      <p className="mt-1 text-sm text-ink-muted">received by <span className="font-mono">{truncateAddress(recipientAddress)}</span></p>
    </motion.div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────

function Dashboard() {
  const { circleId } = useParams<{ circleId: string }>()
  const { address, isConnected } = useWallet()

  const [circle, setCircle] = useState<CircleState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [showPayout] = useState(false)

  // Load circle data
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        await new Promise(r => setTimeout(r, 900))
        const demo = createDemoCircle()
        if (address) demo.memberStates[0].address = address
        setCircle(demo)
        setCountdown(demo.cycleDeadline - Math.floor(Date.now() / 1000))
      } catch {
        setError('Could not load circle data. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [circleId, address])

  // Live countdown
  useEffect(() => {
    if (!circle) return
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [circle])

  const handlePay = async () => {
    if (!isConnected) return
    setIsPaying(true)
    setPayError(null)
    try {
      await new Promise(r => setTimeout(r, 1500))
      setPaySuccess(true)
      if (circle) {
        setCircle(prev => prev ? {
          ...prev,
          memberStates: prev.memberStates.map(m =>
            m.address === address ? { ...m, totalContributed: m.totalContributed + prev.contributionAmount } : m
          )
        } : null)
      }
    } catch {
      setPayError('Transaction failed. Try again or check your wallet.')
    } finally {
      setIsPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-parchment"><Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto"><SkeletonDashboard /></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-parchment"><Navbar />
      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
        <div className="card text-center">
          <p className="text-rust-signal font-medium mb-2">{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    </div>
  )

  if (!circle) return (
    <div className="min-h-screen bg-parchment"><Navbar />
      <div className="pt-24"><EmptyDashboard /></div>
    </div>
  )

  const currentCycleRecord = circle.cycles.find(c => c.cycleNumber === circle.currentCycle && !c.closed)
  const recipient = circle.payoutOrder[circle.currentCycle - 1]
  const myState = circle.memberStates.find(m => m.address === address)
  const myPaidThisCycle = currentCycleRecord?.contributions[address ?? ''] ?? false
  const totalPot = fromContractAmount(circle.contributionAmount) * circle.memberCount
  const paidCount = currentCycleRecord
    ? Object.values(currentCycleRecord.contributions).filter(Boolean).length
    : 0

  const memberDisplayData = circle.memberStates.map(ms => ({
    ...ms,
    hasPaid: currentCycleRecord?.contributions[ms.address] ?? false,
    isCurrentUser: ms.address === address,
  }))

  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto flex flex-col gap-6">

          {/* Circle header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-light text-ink">{circle.name}</h1>
              <p className="text-sm text-ink-muted mt-0.5 font-mono">
                {circle.id} · Cycle {circle.currentCycle} of {circle.memberCount}
              </p>
            </div>
            <span className={`badge ${circle.status === 'Active' ? 'badge-success' : circle.status === 'Completed' ? 'badge-neutral' : 'badge-warning'}`}>
              {circle.status}
            </span>
          </div>

          {/* Payout banner (completed cycle) */}
          <AnimatePresence>
            {showPayout && circle.cycles[0]?.closed && (
              <PayoutSuccessBanner
                recipientAddress={circle.cycles[0].recipient}
                amount={fromContractAmount(circle.cycles[0].amountPaidOut).toFixed(0)}
                asset="XLM"
              />
            )}
          </AnimatePresence>

          {/* Roundtable + cycle info */}
          <div className="card">
            <RoundtableCanvas
              seatCount={circle.memberCount}
              currentRecipientIndex={circle.currentCycle - 1}
              members={memberDisplayData.map(m => ({
                address: m.address,
                hasPaid: m.hasPaid,
                isLate: m.missedCycles > 0,
              }))}
              height="280px"
              compact
            />

            {/* Cycle summary */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-ink-subtle/10">
              <div className="text-center">
                <p className="text-xs text-ink-subtle mb-1">Pot this cycle</p>
                <p className="font-mono font-medium text-ink">{totalPot.toFixed(0)} XLM</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-ink-subtle mb-1">Paid in</p>
                <p className="font-mono font-medium text-ink">{paidCount}/{circle.memberCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-ink-subtle mb-1">Deadline</p>
                <p className={`font-mono font-medium ${countdown < 86400 ? 'text-rust-signal' : 'text-ink'}`}>
                  {formatCountdown(countdown)}
                </p>
              </div>
            </div>
          </div>

          {/* Pay my share CTA */}
          {circle.status === 'Active' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-ink">This cycle</p>
                  <p className="text-sm text-ink-muted mt-0.5">
                    Recipient: <span className="font-mono">{truncateAddress(recipient)}</span>
                  </p>
                </div>
                <p className="font-mono text-xl font-medium text-ink">
                  {fromContractAmount(circle.contributionAmount).toFixed(0)} XLM
                </p>
              </div>

              <AnimatePresence mode="wait">
                {paySuccess || myPaidThisCycle ? (
                  <motion.div
                    key="paid"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 justify-center py-3 rounded-lg bg-verdigris-light text-verdigris text-sm font-medium"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Paid — you're good this cycle
                  </motion.div>
                ) : (
                  <motion.div key="unpaid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                    <button
                      className="btn-primary w-full justify-center text-base"
                      onClick={handlePay}
                      disabled={isPaying || !isConnected}
                      id="pay-my-share-btn"
                    >
                      {isPaying ? 'Sending…' : `Pay my share — ${fromContractAmount(circle.contributionAmount).toFixed(0)} XLM`}
                    </button>
                    {!isConnected && <p className="text-xs text-center text-ink-subtle">Connect your wallet first</p>}
                    {payError && <p className="text-xs text-rust-signal text-center">{payError}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Member status list */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink text-sm">Members</h2>
              <Link to={`/circle/${circleId}/history`} className="text-xs text-verdigris hover:text-brass">
                View history →
              </Link>
            </div>
            {memberDisplayData.map(m => (
              <MemberRow
                key={m.address}
                address={m.address}
                hasPaid={m.hasPaid}
                isLate={m.missedCycles > 0}
                isCurrentUser={m.isCurrentUser}
                payoutPosition={m.payoutPosition}
              />
            ))}
          </div>

          {/* My stats */}
          {myState && (
            <div className="card">
              <h2 className="font-semibold text-ink text-sm mb-3">Your record</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-ink-subtle">Total contributed</p>
                  <p className="font-mono font-medium text-ink">{fromContractAmount(myState.totalContributed).toFixed(0)} XLM</p>
                </div>
                <div>
                  <p className="text-xs text-ink-subtle">Missed cycles</p>
                  <p className={`font-mono font-medium ${myState.missedCycles > 0 ? 'text-rust-signal' : 'text-ink'}`}>
                    {myState.missedCycles}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-subtle">Your payout</p>
                  <p className="font-mono font-medium text-ink">Cycle {myState.payoutPosition + 1}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-subtle">Outstanding debt</p>
                  <p className={`font-mono font-medium ${myState.debt > 0 ? 'text-rust-signal' : 'text-verdigris'}`}>
                    {myState.debt > 0 ? `${fromContractAmount(myState.debt).toFixed(0)} XLM` : 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Dashboard
