import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Pulsar ErrorBoundary caught an exception]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center text-white select-none">
          <div className="w-12 h-12 rounded-2xl bg-[#FF1838]/20 border border-[#FF1838]/40 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-[#FF1838]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold mb-1">
            {this.props.fallbackTitle || 'حدث خطأ غير متوقع'}
          </h2>
          <p className="text-xs text-white/50 max-w-sm mb-4">
            يرجى إعادة المحاولة أو الانتقال إلى قسم آخر.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-[#FF1838] hover:bg-[#ff3350] text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
