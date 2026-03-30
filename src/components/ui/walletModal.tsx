import { Wallet, X } from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";
import { useEffect } from "react";
import { cn } from "../../lib/utils";
import { createPortal } from "react-dom";

export function WalletModal({ onClose }: { onClose: () => void }) {
    const { connectors, connect } = useWalletConnection();

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function handleConnect(id: string) {
        try { await connect(id); } catch { /* user cancelled */ }
        onClose();
    }

    const modalContent = (
        /* Backdrop — fixed overlay that covers the full viewport */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal panel — stopPropagation prevents backdrop click from closing when clicking inside */}
            <div
                className="w-full max-w-sm mx-4 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-100">Connect wallet</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Connectors */}
                <ul className="divide-y divide-slate-800/60 p-2">
                    {connectors.length === 0 && (
                        <li className="px-4 py-6 text-center text-sm text-slate-400">
                            No wallets detected. Install Phantom, Backpack, or Solflare.
                        </li>
                    )}
                    {connectors.map((c) => (
                        <li key={c.id}>
                            <button
                                onClick={() => handleConnect(c.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors',
                                    'hover:bg-slate-800 text-slate-200',
                                )}
                            >
                                {c.icon ? (
                                    <img src={c.icon} alt={c.name} className="h-8 w-8 rounded-lg object-contain flex-shrink-0" />
                                ) : (
                                    <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <Wallet className="h-4 w-4 text-slate-400" />
                                    </div>
                                )}
                                <span className="flex-1 text-left font-medium">{c.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <p className="px-5 pb-4 text-center text-xs text-slate-500">
                    By connecting, you agree to interact with Solana Devnet.
                </p>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}