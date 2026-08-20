import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || ''

export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }
}

export function captureException(error: unknown, context?: Record<string, any>) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error('[Sentry Error Captured]:', error, context)
  }
}
