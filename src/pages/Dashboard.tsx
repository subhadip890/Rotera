import { motion } from 'framer-motion'
import { pageTransition } from '../lib/motion'

function Dashboard() {
  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment p-6">
        <h1 className="text-2xl font-semibold text-ink">Circle Dashboard</h1>
        <p className="mt-2 text-ink-muted">Your circle at a glance.</p>
      </div>
    </motion.div>
  )
}

export default Dashboard
