"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "0.875rem", opacity: 0.7 }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
