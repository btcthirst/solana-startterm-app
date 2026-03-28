import { useState, useEffect, useCallback } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { address } from '@solana/kit';
import {
    RefreshCw, Loader2, AlertCircle, ExternalLink, ArrowRightLeft, Inbox,
} from 'lucide-react';

import { getTakeOfferInstructionAsync } from '../generated';
import { fetchAllOffers, type OfferAccount } from '../lib/fetchOffers';
import { executeTransaction } from '../lib/executeTransaction';
import { TransactionStatus, type TxStatus } from './TransactionStatus';
import { shortenAddress } from '../lib/utils';

/* ─── Error helper ────────────────────────────────────────────────────── */

function parseError(err: unknown): string {
    if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('User rejected')) return 'Transaction rejected by user.';
        if (msg.includes('Blockhash not found') || msg.includes('blockhash')) return 'Blockhash expired — please try again.';
        if (msg.includes('insufficient')) return 'Insufficient balance.';
        return msg.slice(0, 140);
    }
    return 'Unknown error.';
}

/* ─── Offer Card ──────────────────────────────────────────────────────── */

interface OfferCardState {
    status: TxStatus;
    signature: string | null;
    error: string | null;
}

function OfferCard({
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 transition-colors hover:border-slate-700">
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-slate-400">
                    Maker:{' '}
                    <a
                        href={`https://explorer.solana.com/address/${data.maker}?cluster=devnet`}
                        target="_blank" rel="noreferrer"
                        className="font-mono text-slate-300 hover:text-blue-400 transition-colors"
                        title={data.maker}
                    >
                        {shortenAddress(data.maker, 6)}
                    </a>
                </div>
                <span className="text-xs text-slate-500 font-mono">#{String(data.id).slice(-6)}</span>
            </div>

            {/* Token swap info */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 rounded-lg bg-slate-800/80 px-3 py-2 min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">Offers (Token A)</div>
                    <div className="text-xs font-mono text-slate-300 truncate" title={data.tokenMintA}>
                        {shortenAddress(data.tokenMintA, 8)}
                    </div>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="flex-1 rounded-lg bg-slate-800/80 px-3 py-2 min-w-0">
                    <div className="text-xs text-slate-500 mb-0.5">Wants (Token B)</div>
                    <div className="text-xs font-mono text-slate-300 truncate" title={data.tokenMintB}>
                        {shortenAddress(data.tokenMintB, 8)}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                        {(Number(data.tokenBWantedAmount) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                </div>
            </div>

            {/* Take button */}
            {!done && (
                <button
                    onClick={handleTake}
                    disabled={!connected || state.status === 'pending'}
                    className={
                        'w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
                        'bg-green-600/20 text-green-400 border border-green-600/30 ' +
                        'hover:bg-green-600/30 hover:border-green-500 ' +
                        'disabled:cursor-not-allowed disabled:opacity-50'
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

/* ─── TakeOffer ────────────────────────────────────────────────────────── */

export function TakeOffer() {
    const { connected, wallet } = useWalletConnection();

    const [offers, setOffers] = useState<OfferAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const loadOffers = useCallback(async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const data = await fetchAllOffers();
            setOffers(data);
        } catch (err) {
            setFetchError(err instanceof Error ? err.message : 'Failed to load offers.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadOffers(); }, [loadOffers]);

    /* ── Take handler ──────────────────────────────────────── */
    async function handleTake(offer: OfferAccount): Promise<{ sig: string } | { error: string }> {
        if (!wallet) return { error: 'Wallet not connected.' };
        try {
            const signer = createWalletTransactionSigner(wallet);
            const ix = await getTakeOfferInstructionAsync({
                taker: signer.signer,
                maker: address(offer.data.maker),
                tokenMintA: address(offer.data.tokenMintA),
                tokenMintB: address(offer.data.tokenMintB),
                offer: address(offer.pubkey as `${string}`),
            });
            const sig = await executeTransaction(signer.signer, [ix]);
            // Remove this offer from the list after success
            setOffers((prev) => prev.filter((o) => o.pubkey !== offer.pubkey));
            return { sig };
        } catch (err) {
            return { error: parseError(err) };
        }
    }

    /* ── Render ──────────────────────────────────────────────── */

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Open Offers</h2>
                <button
                    onClick={() => void loadOffers()}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {!connected && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400 text-sm">
                    <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-600" />
                    Connect your wallet to take offers.
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Fetching offers…</span>
                </div>
            )}

            {/* Fetch error */}
            {!loading && fetchError && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 flex items-start gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {fetchError}
                </div>
            )}

            {/* Empty state */}
            {!loading && !fetchError && offers.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500 text-sm space-y-2">
                    <Inbox className="mx-auto h-8 w-8 text-slate-700" />
                    <p>No open offers found.</p>
                    <p className="text-xs">Be the first to make one!</p>
                </div>
            )}

            {/* Offer cards */}
            {!loading && offers.map((offer) => (
                <OfferCard key={offer.pubkey} offer={offer} onTake={handleTake} />
            ))}
        </div>
    );
}
