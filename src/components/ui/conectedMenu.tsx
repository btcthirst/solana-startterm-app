import { Check, ChevronDown, Copy, LogOut, Wallet } from "lucide-react";
import { cn, shortenAddress } from "../../lib/utils";
import { useEffect, useRef, useState } from "react";

export function ConnectedMenu({
    address,
    walletIcon,
    walletName,
    onDisconnect,
}: {
    address: string;
    walletIcon?: string;
    walletName?: string;
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
                    <img src={walletIcon} alt={walletName ?? 'wallet'} className="h-5 w-5 rounded object-contain" />
                ) : (
                    <Wallet className="h-4 w-4 text-slate-400" />
                )}
                <div className="flex flex-col items-start leading-tight">
                    {walletName && (
                        <span className="text-xs text-slate-400 leading-none">{walletName}</span>
                    )}
                    <span className="font-mono text-sm leading-tight">{shortenAddress(address)}</span>
                </div>
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