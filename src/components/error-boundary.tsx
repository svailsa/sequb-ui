'use client';

import React from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryState>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    const errorId = Math.random().toString(36).substring(2, 15);
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate a unique error ID for tracking
    const errorId = this.state.errorId || Math.random().toString(36).substring(2, 15);
    
    // Log error securely without exposing sensitive information
    logger.error('React Error Boundary caught an error:', {
      errorId,
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      componentStack: process.env.NODE_ENV === 'development' ? errorInfo.componentStack : undefined,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler:', handlerError);
      }
    }

    // Send to external error reporting service (if implemented)
    this.reportErrorToService(error, errorInfo, errorId);
  }

  private reportErrorToService(error: Error, errorInfo: React.ErrorInfo, errorId: string): void {
    // This would typically integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just store in sessionStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        const errorReport = {
          errorId,
          message: error.message,
          name: error.name,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          // Don't include full stack traces in production
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        };

        const existingErrors = sessionStorage.getItem('react_errors');
        const errors = existingErrors ? JSON.parse(existingErrors) : [];
        errors.push(errorReport);

        // Keep only the last 10 errors
        if (errors.length > 10) {
          errors.shift();
        }

        sessionStorage.setItem('react_errors', JSON.stringify(errors));
      } catch (storageError) {
        // Fail silently if storage is not available
        logger.warn('Could not store error report:', storageError);
      }
    }
  }

  private handleRefresh = () => {
    // Clear error state and try to recover
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    // Navigate to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent {...this.state} />;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. This has been logged and we're looking into it.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm font-medium text-destructive mb-2">
                    Error Details (Development Only):
                  </p>
                  <p className="text-xs text-destructive/80 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {this.state.errorId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Error ID:</p>
                  <p className="text-sm font-mono text-foreground">{this.state.errorId}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRefresh}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    logger.error('Unhandled error in component:', error);
    setError(error);
  }, []);

  // Throw error to be caught by Error Boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// Higher-order component for class components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}