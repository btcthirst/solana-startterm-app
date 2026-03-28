import { useWalletConnection } from '@solana/react-hooks';
import { useState, useRef, useEffect } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import { cn, shortenAddress } from '../lib/utils';

/* ─── Wallet Connection Modal ─────────────────────────────────────────── */

function WalletModal({ onClose }: { onClose: () => void }) {
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
        /* backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={ref}
                className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
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
        </div>
    );
}

/* ─── Connected dropdown menu ─────────────────────────────────────────── */

function ConnectedMenu({
    address,
    walletIcon,
    onDisconnect,
}: {
    address: string;
    walletIcon?: string;
    onDisconnect: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    async function copyAddress() {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80',
                    'px-3 py-2 text-sm font-medium text-slate-100 transition-colors',
                    'hover:border-slate-600 hover:bg-slate-800',
                )}
            >
                {walletIcon ? (
                    <img src={walletIcon} alt="wallet" className="h-5 w-5 rounded object-contain" />
                ) : (
                    <Wallet className="h-4 w-4 text-slate-400" />
                )}
                <span>{shortenAddress(address)}</span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-2xl z-40">
                    <button
                        onClick={copyAddress}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied!' : 'Copy address'}
                    </button>
                    <button
                        onClick={() => { onDisconnect(); setOpen(false); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─── Public component ────────────────────────────────────────────────── */

export function WalletButton() {
    const { connected, wallet, disconnect } = useWalletConnection();
    const [showModal, setShowModal] = useState(false);

    if (connected && wallet) {
        return (
            <ConnectedMenu
                address={wallet.account.address}
                walletIcon={wallet.connector.icon}
                onDisconnect={disconnect}
            />
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={cn(
                    'flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600/10',
                    'px-4 py-2 text-sm font-medium text-blue-400 transition-colors',
                    'hover:bg-blue-600/20 hover:text-blue-300',
                )}
            >
                <Wallet className="h-4 w-4" />
                Connect wallet
            </button>
            {showModal && <WalletModal onClose={() => setShowModal(false)} />}
        </>
    );
}
