import { ChevronDown, Coins, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { TokenAccount } from '../lib/helius';
import { cn } from '../lib/utils';

/**
 * Props for the TokenSelect component.
 */
interface TokenSelectProps {
    /** Array of token accounts to display in the dropdown. */
    tokens: TokenAccount[];
    /** Whether the tokens are currently being fetched. */
    loading: boolean;
    /** The currently selected token account. */
    value: TokenAccount | null;
    /** Callback function when a new token is selected. */
    onChange: (token: TokenAccount) => void;
    /** Placeholder text when no token is selected. */
    placeholder?: string;
    /** Whether the dropdown is disabled. */
    disabled?: boolean;
}

/**
 * A custom dropdown component for selecting a token from a list of user accounts.
 * Displays token logos, symbols, names, and balances.
 * Includes 'click away' detection to close the dropdown.
 */
export function TokenSelect({
    tokens,
    loading,
    value,
    onChange,
    placeholder = 'Select token…',
    disabled = false,
}: TokenSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const isDisabled = disabled || loading || tokens.length === 0;

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                disabled={isDisabled}
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60',
                    'px-3 py-2.5 text-sm transition-colors',
                    'hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                )}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : value?.logo ? (
                    <img src={value.logo} alt={value.symbol} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                    <Coins className="h-4 w-4 text-slate-400 shrink-0" />
                )}

                <span className={cn('flex-1 text-left truncate', !value && 'text-slate-400')}>
                    {loading
                        ? 'Loading tokens…'
                        : value
                            ? `${value.symbol} — ${value.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
                            : tokens.length === 0
                                ? 'No tokens found'
                                : placeholder}
                </span>

                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform shrink-0', open && 'rotate-180')} />
            </button>

            {open && (
                <ul
                    className={cn(
                        'absolute z-50 mt-1 w-full overflow-auto rounded-lg border border-slate-700',
                        'bg-slate-900 py-1 shadow-2xl',
                        'max-h-60',
                    )}
                >
                    {tokens.map((token) => (
                        <li key={token.mint}>
                            <button
                                type="button"
                                onClick={() => { onChange(token); setOpen(false); }}
                                className={cn(
                                    'flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors',
                                    'hover:bg-slate-800',
                                    value?.mint === token.mint && 'bg-slate-800 text-blue-400',
                                )}
                            >
                                {token.logo ? (
                                    <img src={token.logo} alt={token.symbol} className="h-6 w-6 rounded-full object-cover shrink-0" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                        <span className="text-xs text-slate-300">{token.symbol.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="flex-1 text-left min-w-0">
                                    <div className="font-medium truncate">{token.symbol}</div>
                                    <div className="text-xs text-slate-400 truncate">{token.name}</div>
                                </div>
                                <div className="text-right shrink-0 text-slate-300">
                                    {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}