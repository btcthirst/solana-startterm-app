import { TransactionStatus, type TxStatus } from '../TransactionStatus';
import { shortenAddress } from '../../lib/utils';
import { useWalletConnection } from '@solana/react-hooks';
import { useState } from 'react';
import { ArrowRightLeft, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import type { OfferAccount } from '../../lib/fetchOffers';

/**
 * Internal state for tracking the transaction lifecycle of a single offer card.
 */
interface OfferCardState {
    status: TxStatus;
    signature: string | null;
    error: string | null;
}

/**
 * A visual representation of a single Escrow Offer.
 * Displays both Token A (offered) and Token B (wanted) details,
 * along with the maker's address and a 'Take' button.
 * 
 * @param props - Component properties.
 * @param props.offer - The enriched offer account data.
 * @param props.onTake - Callback to execute the 'take_offer' transaction.
 */
export function OfferCard({
    offer,
    onTake,
}: {
    offer: OfferAccount;
    onTake: (offer: OfferAccount) => Promise<{ sig: string } | { error: string }>;
}) {
    const { data } = offer;
    const [state, setState] = useState<OfferCardState>({ status: 'idle', signature: null, error: null });
    const { connected } = useWalletConnection();

    async function handleTake() {
        setState({ status: 'pending', signature: null, error: null });
        const result = await onTake(offer);
        if ('sig' in result) {
            setState({ status: 'success', signature: result.sig, error: null });
        } else {
            setState({ status: 'error', signature: null, error: result.error });
        }
    }

    const done = state.status === 'success';

    return (
        <div className="group rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-5 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-slate-400">
                    Maker:{' '}
                    <a
                        href={`https://explorer.solana.com/address/${data.maker}?cluster=devnet`}
                        target="_blank" rel="noreferrer"
                        className="font-mono text-slate-300 hover:text-indigo-400 transition-colors"
                        title={data.maker}
                    >
                        {shortenAddress(data.maker, 6)}
                    </a>
                </div>
                <span className="text-xs text-slate-500 font-mono tracking-wider">#{String(data.id).slice(-6)}</span>
            </div>

            {/* Token swap info */}
            <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl bg-slate-950/50 border border-white/5 p-3 min-w-0 transition-colors group-hover:bg-slate-900/80">
                    <div className="text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Offers (Token A)</div>
                    <div className="flex items-center gap-2">
                        {offer.tokenAMeta?.logo ? (
                           <img src={offer.tokenAMeta.logo} className="w-6 h-6 rounded-full" alt="" />
                        ) : (
                           <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                              <ImageIcon className="w-3 h-3 text-slate-500" />
                           </div>
                        )}
                        <div className="min-w-0">
                           <div className="text-sm text-slate-200 font-semibold truncate" title={data.tokenMintA}>
                               {offer.tokenAMeta?.symbol || shortenAddress(data.tokenMintA, 8)}
                           </div>
                           <div className="text-xs text-indigo-400 font-medium mt-0.5">
                               {offer.tokenAAmountUi !== undefined ? offer.tokenAAmountUi.toLocaleString(undefined, { maximumFractionDigits: offer.tokenAMeta?.decimals || 6 }) : '0'} 
                           </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 shadow-inner z-10 -mx-3">
                    <ArrowRightLeft className="h-4 w-4 text-slate-400" />
                </div>

                <div className="flex-1 rounded-xl bg-slate-950/50 border border-white/5 p-3 min-w-0 transition-colors group-hover:bg-slate-900/80">
                    <div className="text-[11px] text-slate-500 font-medium mb-1.5 uppercase tracking-wider">Wants (Token B)</div>
                    <div className="flex items-center gap-2">
                        {offer.tokenBMeta?.logo ? (
                           <img src={offer.tokenBMeta.logo} className="w-6 h-6 rounded-full" alt="" />
                        ) : (
                           <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                              <ImageIcon className="w-3 h-3 text-slate-500" />
                           </div>
                        )}
                        <div className="min-w-0">
                            <div className="text-sm text-slate-200 font-semibold truncate" title={data.tokenMintB}>
                                {offer.tokenBMeta?.symbol || shortenAddress(data.tokenMintB, 8)}
                            </div>
                            <div className="text-xs text-indigo-400 font-medium mt-0.5">
                                {offer.tokenBMeta 
                                   ? (Number(data.tokenBWantedAmount) / (10 ** offer.tokenBMeta.decimals)).toLocaleString(undefined, { maximumFractionDigits: offer.tokenBMeta.decimals })
                                   : (Number(data.tokenBWantedAmount) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Take button */}
            {!done && (
                <button
                    onClick={handleTake}
                    disabled={!connected || state.status === 'pending'}
                    className={
                        'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ' +
                        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 ' +
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ' +
                        'active:scale-[0.98]'
                    }
                >
                    {state.status === 'pending' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                        <>Take Offer</>
                    )}
                </button>
            )}

            <TransactionStatus status={state.status} signature={state.signature} error={state.error} />

            {/* Explorer link for offer account */}
            <a
                href={`https://explorer.solana.com/address/${offer.pubkey}?cluster=devnet`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
                <ExternalLink className="h-3 w-3" />
                View offer account
            </a>
        </div>
    );
}