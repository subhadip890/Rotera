import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { captureException } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary caught]:", error, errorInfo);
    captureException(error, {
      context: "ReactErrorBoundary",
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center bg-background px-4 py-16">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Something unexpected happened
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We encountered an issue displaying this component. You can reload the page or head
              back to safety.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center rounded-md bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-border bg-chalk px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-parchment"
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
