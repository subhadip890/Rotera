import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { pageTransition } from '../../lib/motion'
import { ConnectButton } from '../wallet'

/**
 * Navbar — minimal top bar for the landing page.
 * Logo left, wallet connect right.
 */
function Navbar() {
  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4
                 bg-parchment/80 backdrop-blur-md border-b border-ink-subtle/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
    >
      <Link to="/" className="flex items-center gap-2 no-underline">
        <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#2F6E62" strokeWidth="2.5"/>
          <circle cx="16" cy="2.5" r="3" fill="#C9973C"/>
          <circle cx="27.5" cy="10" r="2.5" fill="#14213D"/>
          <circle cx="27.5" cy="22" r="2.5" fill="#14213D"/>
          <circle cx="16" cy="29.5" r="2.5" fill="#14213D"/>
          <circle cx="4.5" cy="22" r="2.5" fill="#14213D"/>
          <circle cx="4.5" cy="10" r="2.5" fill="#14213D"/>
        </svg>
        <span className="font-display text-xl font-light text-ink tracking-tight">
          Rotera
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/create"
          className="hidden sm:block text-sm font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Start a Circle
        </Link>
        <ConnectButton />
      </div>
    </motion.nav>
  )
}

/**
 * Wrapper for Navbar to use on any page.
 */
export function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...pageTransition}>
      <Navbar />
      <div className="pt-16">
        {children}
      </div>
    </motion.div>
  )
}

export default Navbar
