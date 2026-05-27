"use client";
// components/ErrorBoundary.js
// Catches render errors in any child tree and shows a graceful fallback
// instead of crashing the whole page.
// Usage: wrap any panel or section — <ErrorBoundary><YourComponent /></ErrorBoundary>

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error, info) {
    // You could log to an error service here if needed in the future
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "0.75rem",
          padding:        "2rem",
          textAlign:      "center",
          opacity:        0.65,
          height:         "100%",
          minHeight:      "200px",
        }}>
          <span style={{ fontSize: "1.75rem" }}>⚠️</span>
          <p style={{ margin: 0, fontSize: "0.95rem" }}>
            Something went wrong loading this content.
          </p>
          {this.state.message && (
            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>
              {this.state.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            style={{
              marginTop:     "0.5rem",
              padding:       "0.4rem 1rem",
              fontSize:      "0.85rem",
              cursor:        "pointer",
              borderRadius:  "6px",
              border:        "1px solid currentColor",
              background:    "transparent",
              color:         "inherit",
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
