import { useState, useEffect, useCallback } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { address } from '@solana/kit';
import {
    RefreshCw, Loader2, AlertCircle, Inbox,
} from 'lucide-react';

import { getTakeOfferInstructionAsync } from '../generated';
import { fetchAllOffers, type OfferAccount } from '../lib/fetchOffers';
import { executeTransaction } from '../lib/executeTransaction';
import { OfferCard } from './ui/offerCard';


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