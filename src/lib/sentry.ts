import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const errStr =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error || "");

  // Filter out benign user cancellations and uninstalled extension alerts
  if (
    errStr.toLowerCase().includes("transaction cancelled") ||
    errStr.toLowerCase().includes("user rejected") ||
    errStr.toLowerCase().includes("not_installed") ||
    errStr.toLowerCase().includes("cancelled by the user")
  ) {
    if (import.meta.env.DEV) {
      console.log("[Sentry Filtered - Benign User Action]:", errStr);
    }
    return;
  }

  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  } else {
    console.error("[Sentry Error Captured]:", error, context);
  }
}
