import { Wallet } from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";
import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export function WalletModal({ onClose }: { onClose: () => void }) {
    const { connectors, connect } = useWalletConnection();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function handleConnect(id: string) {
        try { await connect(id); } catch { /* user cancelled */ }
        onClose();
    }

    return (
        <div
            ref={ref}
            className="absolute right-0 top-full mt-2 w-72 z-50 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
        >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <h2 className="text-base font-semibold text-slate-100">Connect wallet</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        aria-label="Close"
                    >
                        ✕
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
                                    <img src={c.icon} alt={c.name} className="h-8 w-8 rounded-lg object-contain" />
                                ) : (
                                    <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center">
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
    );
}