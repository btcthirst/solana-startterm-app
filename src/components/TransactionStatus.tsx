import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

/**
 * Represents the lifecycle of a Solana transaction in the UI.
 */
export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

/**
 * Component for displaying the current status of a transaction.
 * Shows loading spinners, success checks with explorer links, or error messages.
 */
export function TransactionStatus({ status, signature, error }: {
    status: TxStatus; signature?: string | null; error?: string | null;
}) {
    if (status === 'idle') return null;
    return (
        <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
            {status === 'pending' && (
                <div className="flex items-center gap-2 text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending transaction…
                </div>
            )}
            {status === 'success' && signature && (
                <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Transaction confirmed!
                    <a
                        href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                        target="_blank" rel="noreferrer"
                        className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                        Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}
            {status === 'error' && (
                <div className="flex items-start gap-2 text-red-400">
                    <XCircle className="h-4 w-4 mt-0.5" />
                    {error ?? 'Transaction failed'}
                </div>
            )}
        </div>
    );
}