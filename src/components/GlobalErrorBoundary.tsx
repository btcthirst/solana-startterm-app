import { ErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">Something went wrong</h2>
                    <p className="text-sm text-slate-400">
                        We encountered an unexpected error. Don't worry, your funds are safe.
                    </p>
                </div>
                <div className="bg-slate-950/50 rounded-lg p-3 overflow-x-auto text-left border border-slate-800">
                    <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                        {error.message}
                    </pre>
                </div>
                <button
                    onClick={resetErrorBoundary}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-100 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        </div>
    );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
        </ErrorBoundary>
    );
}
