import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

/**
 * Returns true only if the key looks like a real PostHog project key.
 * Real keys: start with 'phc_', at least 30 chars, no placeholder words.
 * This prevents fake/demo keys in .env from triggering 404/401 network requests.
 */
function isRealPostHogKey(key: string): boolean {
  if (!key || key.length < 30) return false;
  if (!key.startsWith('phc_')) return false;
  const lower = key.toLowerCase();
  // Reject obvious placeholders
  if (lower.includes('demo') || lower.includes('test') || lower.includes('placeholder') ||
      lower.includes('your_') || lower.includes('_key')) return false;
  return true;
}

const KEY_VALID = isRealPostHogKey(POSTHOG_KEY)

export function initPostHog() {
  if (!initialized && KEY_VALID) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: true,
    })
    initialized = true
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (KEY_VALID && initialized) {
    posthog.capture(eventName, properties)
  } else {
    console.log(`[PostHog Analytics] ${eventName}`, properties)
  }
}

export function identifyUser(walletAddress: string) {
  if (KEY_VALID && initialized) {
    posthog.identify(walletAddress)
  }
}
