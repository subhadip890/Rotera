import { motion } from 'framer-motion'
import { pageTransition } from '../lib/motion'

function History() {
  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment p-6">
        <h1 className="text-2xl font-semibold text-ink">Circle History</h1>
        <p className="mt-2 text-ink-muted">Every cycle, every payout, fully transparent.</p>
      </div>
    </motion.div>
  )
}

export default History
