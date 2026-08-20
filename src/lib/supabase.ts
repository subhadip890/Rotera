import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export interface FeedbackData {
  wallet_address?: string | null
  rating: number
  comment?: string
  page?: string
}

export async function submitFeedbackToSupabase(data: FeedbackData): Promise<boolean> {
  if (!supabase) {
    console.log('[Rotera Feedback] (No Supabase config — logged locally):', data)
    return true
  }

  const { error } = await supabase.from('feedback').insert([{
    wallet_address: data.wallet_address || null,
    rating: data.rating,
    comment: data.comment || '',
    page: data.page || window.location.pathname,
    created_at: new Date().toISOString(),
  }])

  if (error) {
    console.error('[Rotera Feedback Error]:', error)
    return false
  }

  return true
}
