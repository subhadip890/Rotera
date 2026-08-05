import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '../lib/motion'
import Navbar from '../components/layout/Navbar'
import { createDemoCircle, type CircleState, type CycleRecord, fromContractAmount } from '../lib/contract'
import { formatRelativeTime, truncateAddress } from '../lib/format'

function CycleNode({ record, isFirst }: { record: CycleRecord; isFirst: boolean }) {
  const potAmount = fromContractAmount(record.amountPaidOut)
  const paidCount = Object.values(record.contributions).filter(Boolean).length
  const totalCount = Object.keys(record.contributions).length

  return (
    <motion.div
      className="flex gap-4"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      {/* Timeline spine */}
      <div className="flex flex-col items-center gap-0">
        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 border-2 ${
          record.closed
            ? 'bg-brass border-brass'
            : 'bg-chalk border-verdigris'
        }`} />
        {!isFirst && <div className="w-0.5 flex-1 bg-ink-subtle/20 mt-1" />}
      </div>

      {/* Cycle card */}
      <div className="card mb-4 flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-xs text-ink-subtle">Cycle {record.cycleNumber}</p>
            <p className="text-sm font-semibold text-ink mt-0.5">
              {record.closed ? `${potAmount.toFixed(0)} XLM paid out` : 'In progress'}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            {record.closed ? (
              <span className="badge badge-warning">Closed</span>
            ) : (
              <span className="badge badge-success">Active</span>
            )}
            {record.closed && (
              <p className="text-xs text-ink-subtle mt-1 font-mono">{formatRelativeTime(record.closedAt)}</p>
            )}
          </div>
        </div>

        {/* Recipient */}
        <div className="flex items-center gap-2 py-2 border-t border-ink-subtle/10">
          <div className="w-2 h-2 rounded-full bg-brass flex-shrink-0" />
          <span className="text-xs text-ink-muted">Recipient</span>
          <span className="font-mono text-xs text-ink ml-auto">{truncateAddress(record.recipient, 6, 6)}</span>
        </div>

        {/* Contributions grid */}
        <div className="mt-2 pt-2 border-t border-ink-subtle/10">
          <p className="text-xs text-ink-subtle mb-2">{paidCount}/{totalCount} contributed</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(record.contributions).map(([addr, paid]) => (
              <div
                key={addr}
                title={`${addr}: ${paid ? 'paid' : 'missed'}`}
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-mono border ${
                  paid
                    ? 'bg-verdigris-light border-verdigris text-verdigris'
                    : 'bg-rust-light border-rust-signal text-rust-signal'
                }`}
              >
                {paid ? '✓' : '✗'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ReliabilityRow({ address, missedCycles, totalCycles, isCurrentUser }: {
  address: string; missedCycles: number; totalCycles: number; isCurrentUser: boolean
}) {
  const reliability = totalCycles > 0 ? ((totalCycles - missedCycles) / totalCycles) * 100 : 100

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-ink-subtle/10 last:border-0 ${isCurrentUser ? 'bg-verdigris-light rounded px-2 -mx-2' : ''}`}>
      <span className="font-mono text-xs text-ink flex-1 truncate">{truncateAddress(address, 5, 5)}</span>
      <div className="flex items-center gap-2">
        {missedCycles > 0 && (
          <span className="text-xs text-rust-signal font-mono">{missedCycles} missed</span>
        )}
        <div className="w-16 h-1.5 rounded-full bg-ink-subtle/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${reliability}%`,
              backgroundColor: reliability >= 90 ? 'var(--verdigris)' : reliability >= 70 ? 'var(--brass)' : 'var(--rust-signal)'
            }}
          />
        </div>
        <span className="font-mono text-xs text-ink-subtle w-10 text-right">{reliability.toFixed(0)}%</span>
      </div>
    </div>
  )
}

function History() {
  const { circleId } = useParams<{ circleId: string }>()
  const [circle, setCircle] = useState<CircleState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 700))
      setCircle(createDemoCircle())
      setLoading(false)
    }
    load()
  }, [circleId])

  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-light text-ink">Circle History</h1>
              {circle && <p className="text-sm text-ink-muted mt-0.5">{circle.name}</p>}
            </div>
            {circleId && (
              <Link to={`/circle/${circleId}`} className="btn-ghost text-sm no-underline">← Dashboard</Link>
            )}
          </div>

          {loading ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1,2].map(i => <div key={i} className="card h-32 bg-ink-subtle/10" />)}
            </div>
          ) : !circle ? (
            <div className="card text-center">
              <p className="text-ink-muted">No history yet — the circle hasn't started.</p>
            </div>
          ) : (
            <>
              {/* Timeline of cycles */}
              <section>
                <h2 className="text-sm font-semibold text-ink mb-4">Cycle timeline</h2>
                {circle.cycles.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-ink-muted text-sm">No cycles closed yet.</p>
                  </div>
                ) : (
                  <div>
                    {[...circle.cycles].reverse().map((record, i) => (
                      <CycleNode key={record.cycleNumber} record={record} isFirst={i === circle.cycles.length - 1} />
                    ))}
                  </div>
                )}
              </section>

              {/* Reliability record */}
              <section className="card">
                <h2 className="text-sm font-semibold text-ink mb-3">Contribution reliability</h2>
                <p className="text-xs text-ink-subtle mb-4">
                  Based on {circle.currentCycle - 1} completed cycle{circle.currentCycle > 2 ? 's' : ''}.
                </p>
                {circle.memberStates.map(ms => (
                  <ReliabilityRow
                    key={ms.address}
                    address={ms.address}
                    missedCycles={ms.missedCycles}
                    totalCycles={circle.currentCycle - 1}
                    isCurrentUser={false}
                  />
                ))}
              </section>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default History
