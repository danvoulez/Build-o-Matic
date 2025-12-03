import React from 'react';

type State = { hasError: boolean; error?: any };
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // Log to monitoring if needed
    console.error('ErrorBoundary', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border bg-red-50 p-4 text-red-700">
          Ocorreu um erro inesperado. Tente novamente mais tarde.
        </div>
      );
    }
    return this.props.children;
  }
}