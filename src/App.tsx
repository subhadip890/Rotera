import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { FeedbackWidget } from './components/feedback/FeedbackWidget'

// Lazy-load heavy pages to split bundles
const Landing = lazy(() => import('./pages/Landing'))
const CreateCircle = lazy(() => import('./pages/CreateCircle'))
const JoinCircle = lazy(() => import('./pages/JoinCircle'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const History = lazy(() => import('./pages/History'))

function PageLoading() {
  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Roundtable logo */}
        <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true" className="animate-spin" style={{ animationDuration: '3s' }}>
          <circle cx="16" cy="16" r="14" fill="none" stroke="#2F6E62" strokeWidth="2.5" strokeDasharray="44 88"/>
          <circle cx="16" cy="2.5" r="3" fill="#C9973C"/>
        </svg>
        <p className="font-mono text-xs text-ink-subtle">Loading…</p>
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()

  return (
    <>
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoading />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreateCircle />} />
            <Route path="/join" element={<JoinCircle />} />
            <Route path="/join/:inviteCode" element={<JoinCircle />} />
            <Route path="/circle/:circleId" element={<Dashboard />} />
            <Route path="/circle/:circleId/history" element={<History />} />
            {/* Catch-all: redirect home */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {/* Global feedback widget — always rendered */}
      <FeedbackWidget />
    </>
  )
}

export default App
