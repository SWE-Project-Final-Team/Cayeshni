"use client";

import React from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error; stack?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Could add telemetry here
    console.error("ErrorBoundary caught:", error, info);
    this.setState({
      error,
      stack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg font-body-md text-on-surface-variant">
          <p className="font-body-md text-on-surface">Something went wrong loading this view.</p>
          {this.state.error && (
            <div className="mt-sm text-xs">
              <div className="font-label-sm">Error</div>
              <pre className="bg-surface-container-lowest p-sm rounded max-h-40 overflow-auto">{String(this.state.error.message)}</pre>
              {this.state.stack && (
                <>
                  <div className="font-label-sm mt-xs">Component stack</div>
                  <pre className="bg-surface-container-lowest p-sm rounded max-h-40 overflow-auto">{this.state.stack}</pre>
                </>
              )}
            </div>
          )}
          <div className="mt-sm">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined, stack: undefined })}
              className="text-sm font-label-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactNode;
  }
}

export default ErrorBoundary;
