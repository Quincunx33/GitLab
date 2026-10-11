import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public props!: Props;
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error || new Error('An unexpected render error occurred') };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = Math.random().toString(36).substring(2, 9).toUpperCase();
    console.warn(`[Error ID: ${errorId}] React UI boundary captured error:`, error, errorInfo);
    // You could also store this ID in state if you wanted to display it to the user
  }

  public render() {
    if (this.state.hasError) {
      const errorId = 'ERR-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0e0e0e] text-white p-4 font-sans">
          <div className="bg-[#1e1e1e] p-6 rounded-lg border border-red-900/50 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
              <h2 className="text-lg font-semibold">An Unexpected Error Occurred</h2>
            </div>
            <p className="text-sm text-[#aaa] mb-4">
              The application encountered a critical UI error. If this persists, please reload the application.
            </p>
            <div className="bg-[#111] p-3 rounded overflow-auto text-xs font-mono text-red-400 mb-6 max-h-40 border border-[#333]">
              <div className="text-[10px] text-[#555] mb-1">Error ID: {errorId}</div>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm font-medium transition-colors"
              >
                Reload Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded text-sm font-medium transition-colors"
                title="Clear local storage and reload"
              >
                Hard Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
