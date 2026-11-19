"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-sm text-center">
          <p className="font-hand text-4xl">Oops, the wall fell down.</p>
          <p className="mt-2 text-ink-soft">
            Something unexpected went wrong. Reloading usually puts it back up.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-ink hover:brightness-110"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reload
          </button>
        </div>
      </div>
    );
  }
}
