import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition } from '../lib/motion'
import Navbar from '../components/layout/Navbar'
import { useWallet } from '../components/wallet'
import ConnectButton from '../components/wallet/ConnectButton'
import { RoundtableFallback } from '../components/roundtable'

interface CirclePreview {
  name: string
  organizer: string
  amount: string
  asset: 'XLM' | 'USDC'
  cycleLength: string
  memberCount: number
  filledSeats: number
  yourPosition: number
  payoutOrder: string
}

// Demo circle data — replaced by real contract read in Commit 10
function useDemoCircle(code: string): { circle: CirclePreview | null; loading: boolean } {
  const [circle, setCircle] = useState<CirclePreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    const timer = setTimeout(() => {
      setCircle({
        name: 'Friday Friends Fund',
        organizer: 'GABCD...WXYZ',
        amount: '50',
        asset: 'XLM',
        cycleLength: 'Weekly',
        memberCount: 6,
        filledSeats: 3,
        yourPosition: 4,
        payoutOrder: 'Randomized (ledger hash)',
      })
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [code])

  return { circle, loading }
}

function JoinCircle() {
  const { inviteCode: codeParam } = useParams<{ inviteCode?: string }>()
  const navigate = useNavigate()
  const { isConnected, connect, address } = useWallet()

  const [pastedCode, setPastedCode] = useState(codeParam || '')
  const [activeCode, setActiveCode] = useState(codeParam || '')
  const [step, setStep] = useState<'enter' | 'preview' | 'confirm' | 'success'>(
    codeParam ? 'preview' : 'enter'
  )
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { circle, loading } = useDemoCircle(activeCode)

  const handleLookup = () => {
    if (!pastedCode.trim()) { setError('Paste an invite code or link first.'); return }
    setError(null)
    const code = pastedCode.trim().split('/').pop() || pastedCode.trim()
    setActiveCode(code)
    setStep('preview')
  }

  const handleJoin = async () => {
    if (!isConnected) { await connect(); return }
    setIsJoining(true)
    setError(null)
    try {
      await new Promise(r => setTimeout(r, 1400)) // simulate tx
      setStep('success')
    } catch {
      setError('Could not join the circle. The transaction may have failed — try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <div className="pt-24 pb-16 px-4 flex flex-col items-center">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">

              {/* ── Enter invite code ── */}
              {step === 'enter' && (
                <motion.div key="enter" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">Join a Circle</h1>
                  <p className="text-ink-muted mb-8">Paste an invite link or code from the circle organizer.</p>

                  <div className="card flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2" htmlFor="invite-code">
                        Invite link or code
                      </label>
                      <input
                        id="invite-code"
                        className="input input-mono"
                        placeholder="https://rotera.app/join/ROTERA-XXXXXX"
                        value={pastedCode}
                        onChange={e => setPastedCode(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                      />
                    </div>
                    {error && <p className="text-sm text-rust-signal">{error}</p>}
                    <button className="btn-primary w-full justify-center" onClick={handleLookup} id="lookup-circle">
                      Look up circle
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Circle preview ── */}
              {step === 'preview' && (
                <motion.div key="preview" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">You've been invited</h1>
                  <p className="text-ink-muted mb-8">Review the circle details before joining.</p>

                  {loading ? (
                    <div className="card">
                      <div className="animate-pulse flex flex-col gap-4">
                        {[80, 60, 70, 50, 65].map((w, i) => (
                          <div key={i} className="h-4 rounded" style={{ width: `${w}%`, backgroundColor: 'var(--ink-subtle)' }} />
                        ))}
                      </div>
                    </div>
                  ) : circle ? (
                    <div className="card flex flex-col gap-5">
                      {/* Roundtable visual preview */}
                      <div className="flex justify-center py-2">
                        <RoundtableFallback
                          seatCount={circle.memberCount}
                          currentRecipientIndex={0}
                          paidSeats={Array(circle.filledSeats).fill(true)}
                          size={180}
                        />
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-ink">{circle.name}</h2>
                        <p className="text-xs text-ink-subtle font-mono mt-0.5">
                          Organized by {circle.organizer}
                        </p>
                      </div>

                      {/* Circle details */}
                      {[
                        { label: 'Your contribution', value: `${circle.amount} ${circle.asset} per cycle` },
                        { label: 'Cycle length', value: circle.cycleLength },
                        { label: 'Total members', value: `${circle.memberCount} seats (${circle.filledSeats} filled)` },
                        { label: 'Your position', value: `Seat ${circle.yourPosition} of ${circle.memberCount}` },
                        { label: 'Payout order', value: circle.payoutOrder },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center py-2 border-b border-ink-subtle/15 last:border-0">
                          <span className="text-sm text-ink-muted">{row.label}</span>
                          <span className="text-sm font-medium text-ink font-mono">{row.value}</span>
                        </div>
                      ))}

                      <button
                        className="btn-primary w-full justify-center"
                        onClick={() => setStep('confirm')}
                        id="preview-next"
                      >
                        Continue — review what you're agreeing to
                      </button>
                      <button className="btn-ghost w-full justify-center text-sm" onClick={() => setStep('enter')}>
                        Use a different code
                      </button>
                    </div>
                  ) : (
                    <div className="card text-center">
                      <p className="text-rust-signal font-medium">Circle not found.</p>
                      <p className="text-sm text-ink-muted mt-1">Check the invite code and try again.</p>
                      <button className="btn-secondary mt-4" onClick={() => setStep('enter')}>Try again</button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Confirm & agree ── */}
              {step === 'confirm' && circle && (
                <motion.div key="confirm" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">What you're agreeing to</h1>
                  <p className="text-ink-muted mb-8">Read this before joining — the smart contract enforces these rules automatically.</p>

                  <div className="card flex flex-col gap-4">
                    {[
                      {
                        icon: '📅',
                        text: `You'll contribute ${circle.amount} ${circle.asset} every ${circle.cycleLength.toLowerCase()} for ${circle.memberCount} cycles.`,
                      },
                      {
                        icon: '🔒',
                        text: 'A small deposit is held back and returned only after you complete all contributions — this discourages dropping out early.',
                      },
                      {
                        icon: '⏱',
                        text: 'If you miss a cycle, the shortfall is tracked and deducted from your own payout turn. The rest of the group is not penalized.',
                      },
                      {
                        icon: '✅',
                        text: `You'll receive the full pot (${circle.amount ? (parseFloat(circle.amount) * circle.memberCount).toFixed(0) : '—'} ${circle.asset}) exactly once — on your assigned cycle.`,
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                        <p className="text-sm text-ink-muted leading-relaxed">{item.text}</p>
                      </div>
                    ))}

                    {/* Wallet connect or confirm */}
                    {!isConnected ? (
                      <div className="mt-2 flex flex-col gap-3">
                        <p className="text-sm text-ink-muted text-center">Connect your wallet to join.</p>
                        <div className="flex justify-center">
                          <ConnectButton />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 p-3 rounded-lg bg-verdigris-light text-xs font-mono text-verdigris">
                        Joining as: {address}
                      </div>
                    )}

                    {error && <p className="text-sm text-rust-signal">{error}</p>}

                    <div className="flex gap-3">
                      <button className="btn-ghost flex-1 justify-center" onClick={() => setStep('preview')} id="confirm-back">Back</button>
                      <button
                        className="btn-primary flex-1 justify-center"
                        onClick={handleJoin}
                        disabled={isJoining}
                        id="confirm-join"
                      >
                        {isJoining ? 'Joining…' : isConnected ? 'Confirm & join' : 'Connect wallet first'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Success ── */}
              {step === 'success' && circle && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: 'var(--brass-light)', border: '2px solid var(--brass)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h1 className="font-display text-3xl font-light text-ink">You're in!</h1>
                    <p className="mt-2 text-ink-muted">
                      You've joined <strong>{circle.name}</strong> at seat {circle.yourPosition}.
                    </p>
                  </div>

                  <div className="card text-center">
                    <p className="text-sm text-ink-muted mb-6">
                      The circle starts once all {circle.memberCount} members have joined. You'll get a notification when contributions are open.
                    </p>
                    <button
                      className="btn-primary w-full justify-center"
                      onClick={() => navigate(`/circle/${activeCode}`)}
                      id="go-to-dashboard"
                    >
                      Go to circle dashboard
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default JoinCircle
