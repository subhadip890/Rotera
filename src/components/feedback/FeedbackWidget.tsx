import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '../wallet'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function submitFeedback(data: {
  wallet_address: string | null
  rating: number
  comment: string
  page: string
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('Feedback (no Supabase configured):', data)
    return
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to submit feedback')
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none focus-visible:scale-110"
          style={{ color: star <= (hovered || value) ? 'var(--brass)' : 'var(--ink-subtle)' }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          id={`rating-star-${star}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function FeedbackWidget() {
  const { address } = useWallet()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating.'); return }
    setSubmitting(true)
    setError(null)
    try {
      await submitFeedback({
        wallet_address: address,
        rating,
        comment: comment.trim(),
        page: window.location.pathname,
      })
      setDone(true)
    } catch {
      setError('Could not send feedback. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { setDone(false); setRating(0); setComment(''); setError(null) }, 300)
  }

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm font-medium"
        style={{ backgroundColor: 'var(--chalk)', border: '1px solid var(--ink-subtle)', color: 'var(--ink-muted)' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        id="feedback-btn"
        aria-label="Give feedback"
      >
        <span>💬</span>
        <span className="hidden sm:inline">Feedback</span>
      </motion.button>

      {/* Feedback panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 bg-chalk rounded-xl shadow-xl"
            style={{ border: '1px solid var(--ink-subtle)' }}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink text-sm">How's Rotera?</h3>
                <button className="btn-ghost p-1 min-h-0" onClick={handleClose} aria-label="Close feedback">✕</button>
              </div>

              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <p className="text-2xl mb-2">🙏</p>
                    <p className="text-sm font-medium text-ink">Thanks for the feedback!</p>
                    <p className="text-xs text-ink-muted mt-1">It helps us improve Rotera.</p>
                    <button className="btn-ghost text-sm mt-4" onClick={handleClose}>Close</button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-ink-muted mb-2">Your rating</p>
                      <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-muted mb-1" htmlFor="feedback-comment">
                        Comments <span className="text-ink-subtle">(optional)</span>
                      </label>
                      <textarea
                        id="feedback-comment"
                        className="input text-sm resize-none"
                        rows={3}
                        placeholder="What's working? What's confusing?"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        maxLength={500}
                      />
                    </div>
                    {error && <p className="text-xs text-rust-signal">{error}</p>}
                    <button
                      className="btn-primary w-full justify-center text-sm"
                      onClick={handleSubmit}
                      disabled={submitting}
                      id="feedback-submit"
                    >
                      {submitting ? 'Sending…' : 'Send feedback'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
