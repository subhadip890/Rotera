import { motion } from 'framer-motion'
import { pageTransition } from '../lib/motion'

function CreateCircle() {
  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment p-6">
        <h1 className="text-2xl font-semibold text-ink">Start a Circle</h1>
        <p className="mt-2 text-ink-muted">Set up your rotating savings circle.</p>
      </div>
    </motion.div>
  )
}

export default CreateCircle
