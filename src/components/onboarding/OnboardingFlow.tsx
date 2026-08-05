import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RoundtableFallback } from '../roundtable'

const ONBOARDING_KEY = 'rotera_onboarding_done'

const steps = [
  {
    id: 'what',
    title: 'A savings circle for your group',
    body: 'A rotating savings circle is simple: everyone chips in the same amount each cycle, and one person receives the whole pot. Then the circle rotates to the next person, until everyone has had a turn.',
    visual: <RoundtableFallback seatCount={6} currentRecipientIndex={0} paidSeats={[true, true, false, false, false, false]} size={160} />,
  },
  {
    id: 'wallet',
    title: 'Your wallet is your identity',
    body: 'Rotera uses Freighter — a browser extension like a digital wallet. No password to remember beyond your wallet\'s passphrase. Your Stellar address is how the contract knows it\'s you.',
    visual: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--verdigris-light)', border: '2px solid var(--verdigris)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--verdigris)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
        </div>
        <p className="font-mono text-sm text-ink-subtle">GABCD...WXYZ</p>
      </div>
    ),
  },
  {
    id: 'contribute',
    title: 'Pay in, then receive your turn',
    body: 'Every cycle you pay your contribution. Miss a cycle and the shortfall is tracked as debt against your own payout — the rest of the group is never penalized. When it\'s your turn, the full pot arrives automatically.',
    visual: (
      <div className="flex flex-col gap-2 text-sm w-full max-w-xs">
        {['Priya pays 50 XLM ✓', 'James pays 50 XLM ✓', 'You pay 50 XLM ✓', 'Maria pays 50 XLM ✓', 'Sam missed — debt tracked'].map((line, i) => (
          <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs ${line.includes('missed') ? 'text-rust-signal bg-rust-light' : 'text-verdigris bg-verdigris-light'}`}>
            {line}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'ready',
    title: 'Ready to start',
    body: 'Create a circle and invite your group, or join one with a link from your organizer. The rules are set once and enforced by the smart contract — nobody can bend them, including the organizer.',
    visual: (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--brass-light)', border: '2px solid var(--brass)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm text-ink-muted text-center">You're ready. Start or join a circle below.</p>
      </div>
    ),
  },
]

interface OnboardingFlowProps {
  onDone: () => void
}

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleDone()
    }
  }

  const handleDone = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    onDone()
  }

  const current = steps[step]

  return (
    <motion.div
      className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(20,33,61,0.7)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md bg-chalk rounded-2xl p-6 shadow-xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <button className="text-xs text-ink-subtle hover:text-ink transition-colors" onClick={handleDone} id="onboarding-skip">
            Skip intro
          </button>
        </div>

        {/* Visual area */}
        <div className="flex justify-center min-h-[160px] items-center mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              {current.visual}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${current.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="font-display text-xl font-light text-ink mb-2">{current.title}</h2>
            <p className="text-sm text-ink-muted leading-relaxed">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots + next */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === step ? 'var(--verdigris)' : 'var(--ink-subtle)' }}
              />
            ))}
          </div>
          <button
            className="btn-primary py-2 px-5 text-sm"
            onClick={handleNext}
            id={`onboarding-step-${step + 1}`}
          >
            {step === steps.length - 1 ? 'Get started' : 'Next'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Hook to control onboarding display */
export function useOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setShow(true)
  }, [])

  return { show, dismiss: () => setShow(false) }
}
