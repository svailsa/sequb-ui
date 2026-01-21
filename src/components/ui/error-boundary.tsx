'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { getErrorContext, formatErrorForUser, ErrorContext } from '@/lib/error-context';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorContext: ErrorContext | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorContext: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error caught by boundary:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
    });

    // Get error context from backend
    try {
      const context = await getErrorContext(error);
      this.setState({ errorContext: context });
    } catch (contextError) {
      logger.error('Failed to get error context:', contextError);
    }

    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorContext: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorContext, errorInfo } = this.state;
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      context: errorContext,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard. Please include this when reporting the issue.');
  };

  render() {
    if (this.state.hasError) {
      const { error, errorContext } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Format error for display
      const displayError = errorContext 
        ? formatErrorForUser(errorContext)
        : {
            title: 'Something went wrong',
            message: error?.message || 'An unexpected error occurred',
            actions: ['Retry', 'Go Home'],
          };

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>{displayError.title}</CardTitle>
              </div>
              <CardDescription>
                {displayError.message}
              </CardDescription>
            </CardHeader>
            
            {errorContext?.suggestions && errorContext.suggestions.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errorContext.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="flex space-x-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                size="sm"
              >
                Reload Page
              </Button>
              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={this.handleReportBug}
                  variant="ghost"
                  size="sm"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Copy Error
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}