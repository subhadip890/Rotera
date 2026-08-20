import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || ''
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initPostHog() {
  if (!initialized && POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: true,
      capture_pageview: true,
    })
    initialized = true
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (POSTHOG_KEY && initialized) {
    posthog.capture(eventName, properties)
  } else {
    console.log(`[PostHog Analytics] ${eventName}`, properties)
  }
}

export function identifyUser(walletAddress: string) {
  if (POSTHOG_KEY && initialized) {
    posthog.identify(walletAddress)
  }
}
