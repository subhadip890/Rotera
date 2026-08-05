import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Landing from './pages/Landing'
import CreateCircle from './pages/CreateCircle'
import JoinCircle from './pages/JoinCircle'
import Dashboard from './pages/Dashboard'
import History from './pages/History'

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateCircle />} />
        <Route path="/join" element={<JoinCircle />} />
        <Route path="/join/:inviteCode" element={<JoinCircle />} />
        <Route path="/circle/:circleId" element={<Dashboard />} />
        <Route path="/circle/:circleId/history" element={<History />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
