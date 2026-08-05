import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RoundtableCanvas } from '../components/roundtable'
import Navbar from '../components/layout/Navbar'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const steps = [
  {
    number: '01',
    title: 'Create a circle',
    description:
      'Set the contribution amount, cycle length, and invite your group. Everyone agrees to the same rules before the circle starts.',
  },
  {
    number: '02',
    title: 'Contribute each cycle',
    description:
      'Every cycle, each member pays their share. The smart contract tracks who\'s paid and who hasn\'t — no chasing people.',
  },
  {
    number: '03',
    title: 'Take turns receiving',
    description:
      'Each cycle, the full pot goes to one member. The order is set when the circle starts — either agreed by the group or randomized fairly.',
  },
]

const socialProof = [
  { stat: 'Used worldwide', label: 'Chit funds, susu, tanda, stokvel — same concept, one smart contract' },
  { stat: 'On Stellar', label: 'Low fees, fast settlement, real enforcement by code' },
  { stat: 'Fully transparent', label: 'Every contribution and payout recorded on-chain forever' },
]

function Landing() {
  // Demo members for the hero Roundtable
  const demoMembers = [
    { address: 'GABCD...WXYZ', hasPaid: true, isLate: false },
    { address: 'GDEFG...STUV', hasPaid: true, isLate: false },
    { address: 'GHIJK...QRST', hasPaid: false, isLate: false },
    { address: 'GLMNO...MNOP', hasPaid: false, isLate: false },
    { address: 'GPQRS...IJKL', hasPaid: true, isLate: false },
    { address: 'GTUVW...EFGH', hasPaid: false, isLate: true },
  ]

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
          Full-bleed, Roundtable as dominant visual, headline off-center
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(47,110,98,0.06) 0%, transparent 60%)',
          }}
        />

        <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Copy — off-center, not a centered hero template */}
          <motion.div
            className="relative z-10 max-w-xl"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <span className="inline-block px-3 py-1 text-xs font-mono font-medium text-verdigris
                             bg-verdigris-light rounded-full mb-6 tracking-wide">
                Built on Stellar
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-ink leading-tight"
              variants={fadeUp}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              A savings circle{' '}
              <br className="hidden sm:block" />
              where{' '}
              <em className="font-display italic text-verdigris" style={{ fontWeight: 300 }}>
                everyone
              </em>{' '}
              takes turns.
            </motion.h1>

            <motion.p
              className="mt-6 text-lg text-ink-muted leading-relaxed max-w-md"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              Rotera puts the rotating savings circle — chit fund, susu, tanda,
              stokvel — on-chain. A smart contract enforces the rules so nobody
              can bend them. Your group stays in charge.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <Link to="/create" className="btn-primary text-base px-8 py-3 no-underline" id="hero-cta-create">
                Start a Circle
              </Link>
              <Link to="/join" className="btn-secondary text-base px-6 py-3 no-underline" id="hero-cta-join">
                Join with invite
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Roundtable 3D hero — the thesis statement */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <RoundtableCanvas
              seatCount={6}
              currentRecipientIndex={0}
              members={demoMembers}
              height="min(500px, 60vh)"
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS
          Three steps, clean and numbered
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-chalk" id="how-it-works">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-light text-ink text-center">
              How it works
            </h2>
            <p className="mt-3 text-center text-ink-muted max-w-md mx-auto">
              The same concept people have used for generations — now enforced
              by code instead of trust alone.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                className="relative p-6 rounded-xl bg-parchment/50"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
              >
                <span className="font-mono text-sm text-brass font-medium">
                  {step.number}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SOCIAL PROOF / WHY
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-parchment">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {socialProof.map((item, i) => (
              <motion.div
                key={item.stat}
                className="text-center md:text-left"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
              >
                <h3 className="text-xl font-semibold text-ink">{item.stat}</h3>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM CTA
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-ink">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-light text-chalk">
              Your group, your rules, one smart contract.
            </h2>
            <p className="mt-4 text-parchment/70 max-w-md mx-auto">
              No middleman, no spreadsheet, no "I'll pay you back." Start a
              circle and let the contract do its job.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/create"
                className="btn-primary text-base px-8 py-3 no-underline"
                id="bottom-cta-create"
              >
                Start a Circle
              </Link>
              <Link
                to="/join"
                className="btn-ghost text-chalk hover:bg-chalk/10 text-base no-underline"
                id="bottom-cta-join"
              >
                Join with invite code
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════ */}
      <footer className="py-8 bg-ink border-t border-chalk/10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="14" fill="none" stroke="#2F6E62" strokeWidth="2.5"/>
              <circle cx="16" cy="2.5" r="3" fill="#C9973C"/>
            </svg>
            <span className="font-display text-sm font-light text-chalk/70">
              Rotera
            </span>
          </div>
          <p className="text-xs text-chalk/40">
            Built on Stellar. Open source.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
