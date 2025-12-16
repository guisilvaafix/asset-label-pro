import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-screen p-4 bg-background">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                <CardTitle>Algo deu errado</CardTitle>
                            </div>
                            <CardDescription>
                                Ocorreu um erro inesperado na aplicação
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {this.state.error && (
                                <div className="rounded-md bg-muted p-3 text-sm font-mono text-muted-foreground overflow-auto max-h-40">
                                    {this.state.error.message}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button onClick={this.handleReset} variant="outline" className="flex-1">
                                Tentar Novamente
                            </Button>
                            <Button onClick={this.handleReload} className="flex-1 gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Recarregar Página
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return setError;
}
