import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pageTransition } from '../lib/motion'
import Navbar from '../components/layout/Navbar'
import { useWallet } from '../components/wallet'

type Asset = 'XLM' | 'USDC'
type CycleLength = 'weekly' | 'biweekly' | 'monthly'
type PayoutOrder = 'manual' | 'random'

interface CircleFormData {
  name: string
  amount: string
  asset: Asset
  cycleLength: CycleLength
  memberCount: number
  payoutOrder: PayoutOrder
}

const cycleLengthOptions: { value: CycleLength; label: string; days: number }[] = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'biweekly', label: 'Every 2 weeks', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
]

const slideVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
}

function CreateCircle() {
  const navigate = useNavigate()
  const { isConnected, connect } = useWallet()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<CircleFormData>({
    name: '',
    amount: '',
    asset: 'XLM',
    cycleLength: 'weekly',
    memberCount: 5,
    payoutOrder: 'manual',
  })
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalPot = form.amount
    ? (parseFloat(form.amount) * form.memberCount).toFixed(2)
    : '—'

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim()) { setError('Give your circle a name.'); return }
      if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a contribution amount greater than 0.'); return }
    }
    setError(null)
    setStep(s => s + 1)
  }

  const handleSubmit = useCallback(async () => {
    if (!isConnected) { await connect(); return }
    setIsSubmitting(true)
    setError(null)
    try {
      // Generate a demo invite code (will be replaced by real contract call in Commit 10)
      const code = `ROTERA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      await new Promise(r => setTimeout(r, 1200)) // simulate tx
      setInviteCode(code)
      setStep(4) // success step
    } catch {
      setError('Something went wrong creating the circle. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isConnected, connect])

  const handleCopy = async () => {
    if (!inviteCode) return
    const link = `${window.location.origin}/join/${inviteCode}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <div className="pt-24 pb-16 px-4 flex flex-col items-center">
          {/* Progress bar */}
          {step < 4 && (
            <div className="w-full max-w-lg mb-8">
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className="flex-1 h-1 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: s <= step ? 'var(--verdigris)' : 'var(--ink-subtle)' }}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-subtle font-mono">Step {step} of 3</p>
            </div>
          )}

          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Circle details ── */}
              {step === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">Start a Circle</h1>
                  <p className="text-ink-muted mb-8">Set the rules. Everyone in your group agrees before the circle starts.</p>

                  <div className="card flex flex-col gap-6">
                    {/* Circle name */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2" htmlFor="circle-name">
                        Circle name
                      </label>
                      <input
                        id="circle-name"
                        className="input"
                        placeholder="e.g. Friday Friends Fund"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        maxLength={50}
                      />
                    </div>

                    {/* Amount + asset */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2" htmlFor="amount">
                        Contribution per cycle
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="amount"
                          className="input input-mono flex-1"
                          type="number"
                          min="1"
                          step="any"
                          placeholder="50"
                          value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        />
                        <div className="flex rounded-lg border border-ink-subtle/30 overflow-hidden text-sm">
                          {(['XLM', 'USDC'] as Asset[]).map(a => (
                            <button
                              key={a}
                              className={`px-3 py-2 font-mono font-medium transition-colors ${form.asset === a
                                ? 'bg-verdigris text-chalk'
                                : 'bg-chalk text-ink-muted hover:bg-verdigris-light'}`}
                              onClick={() => setForm(f => ({ ...f, asset: a }))}
                              id={`asset-${a.toLowerCase()}`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cycle length */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">Cycle length</label>
                      <div className="grid grid-cols-3 gap-2">
                        {cycleLengthOptions.map(opt => (
                          <button
                            key={opt.value}
                            className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                              form.cycleLength === opt.value
                                ? 'border-verdigris bg-verdigris-light text-verdigris'
                                : 'border-ink-subtle/30 bg-chalk text-ink-muted hover:border-verdigris-mid'
                            }`}
                            onClick={() => setForm(f => ({ ...f, cycleLength: opt.value }))}
                            id={`cycle-${opt.value}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Member count */}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2" htmlFor="member-count">
                        Number of members
                        <span className="ml-2 font-mono text-verdigris">{form.memberCount}</span>
                      </label>
                      <input
                        id="member-count"
                        type="range"
                        min={3}
                        max={12}
                        value={form.memberCount}
                        onChange={e => setForm(f => ({ ...f, memberCount: parseInt(e.target.value) }))}
                        className="w-full accent-verdigris"
                      />
                      <div className="flex justify-between text-xs text-ink-subtle font-mono mt-1">
                        <span>3</span><span>12</span>
                      </div>
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-rust-signal">{error}</p>}

                    <button className="btn-primary w-full justify-center" onClick={handleNext} id="step1-next">
                      Next — set payout order
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Payout order ── */}
              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">Payout order</h1>
                  <p className="text-ink-muted mb-8">Decide who receives the pot each cycle.</p>

                  <div className="card flex flex-col gap-4">
                    {/* Manual */}
                    <button
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        form.payoutOrder === 'manual'
                          ? 'border-verdigris bg-verdigris-light'
                          : 'border-ink-subtle/30 hover:border-verdigris-mid'
                      }`}
                      onClick={() => setForm(f => ({ ...f, payoutOrder: 'manual' }))}
                      id="payout-manual"
                    >
                      <p className="font-semibold text-ink">We'll decide together</p>
                      <p className="text-sm text-ink-muted mt-1">Your group agrees on the order beforehand. You enter it here. Best when trust is already established.</p>
                    </button>

                    {/* Random */}
                    <button
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        form.payoutOrder === 'random'
                          ? 'border-verdigris bg-verdigris-light'
                          : 'border-ink-subtle/30 hover:border-verdigris-mid'
                      }`}
                      onClick={() => setForm(f => ({ ...f, payoutOrder: 'random' }))}
                      id="payout-random"
                    >
                      <p className="font-semibold text-ink">Randomize for me</p>
                      <p className="text-sm text-ink-muted mt-1">Order derived from a future Stellar ledger sequence — nobody can predict or bias it. The method is public so anyone can verify.</p>
                      {form.payoutOrder === 'random' && (
                        <div className="mt-3 p-3 rounded-lg bg-brass-light border border-brass/20 text-xs font-mono text-ink-muted">
                          <span className="text-brass font-medium">How it works: </span>
                          The circle activates at ledger N. The order is derived from <code>sha256(circleId + ledger_N_hash)</code> — a value unknown at setup time, visible to everyone, and impossible to rig.
                        </div>
                      )}
                    </button>

                    <div className="flex gap-3 mt-2">
                      <button className="btn-ghost flex-1 justify-center" onClick={() => setStep(1)} id="step2-back">Back</button>
                      <button className="btn-primary flex-1 justify-center" onClick={handleNext} id="step2-next">Review circle</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  <h1 className="font-display text-3xl font-light text-ink mb-1">Review your circle</h1>
                  <p className="text-ink-muted mb-8">Once live, these rules can't be changed.</p>

                  <div className="card flex flex-col gap-4">
                    {[
                      { label: 'Circle name', value: form.name },
                      { label: 'Contribution', value: `${form.amount} ${form.asset} per cycle` },
                      { label: 'Cycle length', value: cycleLengthOptions.find(o => o.value === form.cycleLength)?.label ?? '' },
                      { label: 'Members', value: `${form.memberCount} people` },
                      { label: 'Total pot per cycle', value: `${totalPot} ${form.asset}` },
                      { label: 'Payout order', value: form.payoutOrder === 'random' ? 'Randomized (ledger hash)' : 'Manual (group agreement)' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center py-2 border-b border-ink-subtle/15 last:border-0">
                        <span className="text-sm text-ink-muted">{row.label}</span>
                        <span className="text-sm font-medium text-ink font-mono">{row.value}</span>
                      </div>
                    ))}

                    <div className="mt-2 p-3 rounded-lg bg-verdigris-light text-xs text-verdigris">
                      By creating this circle you agree that the smart contract will enforce contributions and payouts automatically. No one — including you as organizer — can override it once active.
                    </div>

                    {error && <p className="text-sm text-rust-signal">{error}</p>}

                    <div className="flex gap-3">
                      <button className="btn-ghost flex-1 justify-center" onClick={() => setStep(2)} id="step3-back">Back</button>
                      <button
                        className="btn-primary flex-1 justify-center"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        id="step3-create"
                      >
                        {isSubmitting ? 'Creating…' : isConnected ? 'Create circle' : 'Connect wallet & create'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Success — invite link ── */}
              {step === 4 && inviteCode && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                  {/* Brass success moment */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: 'var(--brass-light)', border: '2px solid var(--brass)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h1 className="font-display text-3xl font-light text-ink">Circle created!</h1>
                    <p className="mt-2 text-ink-muted">Share this invite code with your {form.memberCount} members.</p>
                  </div>

                  <div className="card">
                    <p className="text-sm font-medium text-ink mb-3">Invite link</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-parchment border border-ink-subtle/20">
                      <span className="font-mono text-sm text-ink flex-1 truncate">
                        {window.location.origin}/join/{inviteCode}
                      </span>
                      <button
                        className="btn-secondary py-1.5 px-3 text-sm flex-shrink-0"
                        onClick={handleCopy}
                        id="copy-invite"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-brass-light text-xs text-ink-muted">
                      <span className="text-brass font-medium">Your invite code: </span>
                      <span className="font-mono">{inviteCode}</span>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        className="btn-secondary flex-1 justify-center"
                        onClick={() => navigate('/')}
                      >
                        Back to home
                      </button>
                      <button
                        className="btn-primary flex-1 justify-center"
                        onClick={() => navigate(`/circle/${inviteCode}`)}
                        id="go-to-dashboard"
                      >
                        Go to dashboard
                      </button>
                    </div>
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

export default CreateCircle
