'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo });
        
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error monitoring service (Sentry, etc.)
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/dashboard';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
                    <Card className="w-full max-w-lg shadow-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl">Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Our team has been notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 overflow-auto max-h-48">
                                    <p className="font-mono text-sm text-red-600 dark:text-red-400">
                                        {this.state.error.message}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2 justify-center">
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                className="gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
): React.FC<P> {
    return function WrappedComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
