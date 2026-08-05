import { motion } from 'framer-motion'
import { pageTransition } from '../lib/motion'

function Landing() {
  return (
    <motion.div {...pageTransition}>
      <div className="min-h-screen bg-parchment">
        {/* Placeholder — will be built in Commit 3 */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="font-display text-5xl font-light text-ink leading-tight">
              Rotera
            </h1>
            <p className="mt-4 text-lg text-ink-muted font-body">
              Rotating savings circles, on-chain.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Landing
