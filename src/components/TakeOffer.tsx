import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { address } from '@solana/kit';
import { RefreshCw, AlertCircle, Inbox } from 'lucide-react';

import { getTakeOfferInstructionAsync } from '../generated';
import { ESCROW_PROGRAM_ADDRESS } from '../generated/programs/escrow';
import { fetchAllOffers, type OfferAccount } from '../lib/fetchOffers';
import { executeTransaction } from '../lib/executeTransaction';
import { rpcSubscriptions } from '../lib/rpc';
import { OfferCard } from './ui/offerCard';

type Filter = 'all' | 'mine';

function parseError(err: unknown): string {
    if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('User rejected')) return 'Transaction rejected by user.';
        if (msg.includes('Blockhash not found') || msg.includes('blockhash')) return 'Blockhash expired — please try again.';
        if (msg.includes('insufficient')) return 'Insufficient balance.';
        if (msg.includes('-32002')) return 'Transaction rejected by smart contract or insufficient funds.';
        return msg.slice(0, 140);
    }
    return 'Unknown error.';
}

export function TakeOffer() {
    const { connected, wallet } = useWalletConnection();
    const walletAddress = wallet ? String(wallet.account.address) : null;

    const [offers, setOffers] = useState<OfferAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');

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

    useEffect(() => {
        let abortController = new AbortController();
        let timeout: ReturnType<typeof setTimeout>;

        async function setupWebsocket() {
            try {
                const notifications = await rpcSubscriptions
                    .programNotifications(
                        address(ESCROW_PROGRAM_ADDRESS),
                        { commitment: 'confirmed' }
                    )
                    .subscribe({ abortSignal: abortController.signal });

                for await (const _notif of notifications) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => { void loadOffers(); }, 500);
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.name !== 'AbortError') console.error('WS Error:', e);
            }
        }
        setupWebsocket();

        return () => {
            clearTimeout(timeout);
            abortController.abort();
        };
    }, [loadOffers]);

    const visibleOffers = useMemo(() => {
        if (filter === 'mine' && walletAddress) {
            return offers.filter((o) => o.data.maker === walletAddress);
        }
        return offers;
    }, [offers, filter, walletAddress]);

    async function handleTake(offer: OfferAccount): Promise<{ sig: string } | { error: string }> {
        if (!wallet) return { error: 'Wallet not connected.' };
        try {
            const { signer } = createWalletTransactionSigner(wallet);
            const ix = await getTakeOfferInstructionAsync({
                taker: signer,
                maker: address(offer.data.maker),
                tokenMintA: address(offer.data.tokenMintA),
                tokenMintB: address(offer.data.tokenMintB),
                offer: address(offer.pubkey as `${string}`),
            });
            const sig = await executeTransaction(signer, [ix]);
            return { sig };
        } catch (err) {
            return { error: parseError(err) };
        }
    }

    const myCount = walletAddress
        ? offers.filter((o) => o.data.maker === walletAddress).length
        : 0;

    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-slate-100">Open Offers</h2>

                <div className="flex items-center gap-2">
                    {/* Filter tabs */}
                    {connected && (
                        <div className="flex rounded-lg border border-slate-700 bg-slate-800/60 p-0.5 text-xs">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                    filter === 'all'
                                        ? 'bg-indigo-500 text-white shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                All
                                {offers.length > 0 && (
                                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        filter === 'all'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {offers.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setFilter('mine')}
                                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                    filter === 'mine'
                                        ? 'bg-indigo-500 text-white shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                My offers
                                {myCount > 0 && (
                                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                        filter === 'mine'
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {myCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={() => void loadOffers()}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {!connected && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400 text-sm">
                    <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-600" />
                    Connect your wallet to take offers.
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md p-5 space-y-4 animate-pulse">
                            <div className="flex items-start justify-between gap-2">
                                <div className="h-3 w-32 bg-slate-800 rounded-md"></div>
                                <div className="h-3 w-16 bg-slate-800 rounded-md"></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 rounded-xl bg-slate-950/30 border border-white/5 p-3 h-[72px] flex flex-col justify-end">
                                    <div className="h-2 w-20 bg-slate-800 rounded mb-2"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 w-16 bg-slate-800 rounded"></div>
                                            <div className="h-2 w-10 bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 z-10 -mx-3"></div>
                                <div className="flex-1 rounded-xl bg-slate-950/30 border border-white/5 p-3 h-[72px] flex flex-col justify-end">
                                    <div className="h-2 w-20 bg-slate-800 rounded mb-2"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800"></div>
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 w-16 bg-slate-800 rounded"></div>
                                            <div className="h-2 w-10 bg-slate-800 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Fetch error */}
            {!loading && fetchError && (
                <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 flex items-start gap-2 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {fetchError}
                </div>
            )}

            {/* Empty states */}
            {!loading && !fetchError && visibleOffers.length === 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center text-slate-500 text-sm space-y-2">
                    <Inbox className="mx-auto h-8 w-8 text-slate-700" />
                    {filter === 'mine' ? (
                        <>
                            <p>You have no open offers.</p>
                            <p className="text-xs">Switch to the Make Offer tab to create one.</p>
                        </>
                    ) : (
                        <>
                            <p>No open offers found.</p>
                            <p className="text-xs">Be the first to make one!</p>
                        </>
                    )}
                </div>
            )}

            {/* Offer cards */}
            {!loading && visibleOffers.map((offer) => (
                <OfferCard key={offer.pubkey} offer={offer} onTake={handleTake} />
            ))}
        </div>
    );
}