import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page text-text-primary flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-status-declined/10 border border-status-declined/30 flex items-center justify-center text-status-declined">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred in the application.'}
            </p>
            <Button variant="primary" onClick={this.handleReset} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" /> Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
