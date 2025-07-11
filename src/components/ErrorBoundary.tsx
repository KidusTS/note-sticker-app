"use client";

import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 
                        flex items-center justify-center p-4"
        >
          <div
            className="bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700 
                          p-6 sm:p-8 max-w-md w-full text-center"
          >
            <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 
                         bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                         font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 
                         transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={16} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
