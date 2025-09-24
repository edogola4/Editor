import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ErrorBoundaryProps, ErrorFallbackProps } from '../../types';
import Button from './Button';

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-red-500/20 rounded-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>

        <p className="text-slate-400 mb-6">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>

        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={resetError}
            icon={RefreshCw}
            className="w-full"
          >
            Try Again
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Reload Page
          </Button>
        </div>

        <details className="mt-6 text-left">
          <summary className="text-slate-400 cursor-pointer hover:text-slate-300">
            Error Details
          </summary>
          <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-red-400 overflow-auto whitespace-pre-wrap">
            {error.message}
            {error.stack && '\n\n' + error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state as { hasError: boolean; error: Error | null };
    const { children, fallback: Fallback = ErrorFallback } = this.props;

    if (hasError && error) {
      return <Fallback error={error} resetError={this.resetError} />;
    }

    return children;
  }
}

export default ErrorBoundary;
