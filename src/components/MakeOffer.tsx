import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { address } from '@solana/kit';
import { ArrowRightLeft, Loader2, AlertCircle } from 'lucide-react';

import { getMakeOfferInstructionAsync } from '../generated';
import { executeTransaction } from '../lib/executeTransaction';
import { useTokenAccounts } from '../hooks/useTokenAccounts';
import { TokenSelect } from './TokenSelect';
import { TransactionStatus, type TxStatus } from './TransactionStatus';
import type { TokenAccount } from '../lib/helius';

/* ─── helpers ──────────────────────────────────────────────────────────── */

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

/* ─── Field label ───────────────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
    return <label className="block text-xs font-medium text-slate-400 mb-1.5">{children}</label>;
}

/* ─── MakeOffer ─────────────────────────────────────────────────────────── */

export function MakeOffer() {
    const { connected, wallet } = useWalletConnection();

    // Token A — from wallet
    const { tokens, loading: tokensLoading, error: tokensError } = useTokenAccounts(
        wallet ? String(wallet.account.address) : null,
    );
    const [tokenA, setTokenA] = useState<TokenAccount | null>(null);
    const [amountA, setAmountA] = useState('');

    // Token B — by mint address
    const [mintB, setMintB] = useState('');
    const [amountB, setAmountB] = useState('');

    // TX state
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [signature, setSignature] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

    /* ── Validation ──────────────────────────────────────── */
    const parsedAmountA = parseFloat(amountA);
    const parsedAmountB = parseFloat(amountB);

    const isValid =
        tokenA !== null &&
        !isNaN(parsedAmountA) && parsedAmountA > 0 && parsedAmountA <= tokenA.balance &&
        mintB.trim().length >= 32 &&
        !isNaN(parsedAmountB) && parsedAmountB > 0;

    /* ── Submit ──────────────────────────────────────────── */
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || !wallet || !tokenA) return;

        setTxStatus('pending');
        setSignature(null);
        setTxError(null);

        try {
            const { signer } = createWalletTransactionSigner(wallet);

            const ix = await getMakeOfferInstructionAsync({
                maker: signer,
                tokenMintA: address(tokenA.mint),
                tokenMintB: address(mintB.trim() as `${string}`),
                id: BigInt(Date.now()),
                tokenAOfferedAmount: BigInt(Math.round(parsedAmountA * 10 ** tokenA.decimals)),
                tokenBWantedAmount: BigInt(Math.round(parsedAmountB * 10 ** 6)),
            });

            const sig = await executeTransaction(signer, [ix]);
            setSignature(sig);
            setTxStatus('success');
            // reset form
            setTokenA(null);
            setAmountA('');
            setMintB('');
            setAmountB('');
        } catch (err) {
            setTxError(parseError(err));
            setTxStatus('error');
        }
    }

    /* ── Render ──────────────────────────────────────────── */

    if (!connected) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
                <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                Connect your wallet to make an offer.
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-5"
        >
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-400" />
                Make Offer
            </h2>

            {/* Token A */}
            <fieldset className="rounded-lg border border-slate-800 p-4 space-y-3">
                <legend className="px-1 text-xs text-slate-500 font-medium">You offer</legend>

                <div>
                    <Label>Token A (from your wallet)</Label>
                    {tokensError && (
                        <p className="mb-1.5 text-xs text-red-400">{tokensError}</p>
                    )}
                    <TokenSelect
                        tokens={tokens}
                        loading={tokensLoading}
                        value={tokenA}
                        onChange={(t) => { setTokenA(t); setAmountA(''); }}
                        disabled={txStatus === 'pending'}
                    />
                </div>

                <div>
                    <Label>
                        Amount A
                        {tokenA && (
                            <span className="ml-1 text-slate-500">
                                (max {tokenA.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })})
                            </span>
                        )}
                    </Label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        disabled={!tokenA || txStatus === 'pending'}
                        className={
                            'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm ' +
                            'text-slate-100 placeholder-slate-500 transition-colors ' +
                            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
                            'disabled:cursor-not-allowed disabled:opacity-50'
                        }
                    />
                    {tokenA && parsedAmountA > tokenA.balance && (
                        <p className="mt-1 text-xs text-red-400">Exceeds available balance.</p>
                    )}
                </div>
            </fieldset>

            {/* Token B */}
            <fieldset className="rounded-lg border border-slate-800 p-4 space-y-3">
                <legend className="px-1 text-xs text-slate-500 font-medium">You want</legend>

                <div>
                    <Label>Token B mint address</Label>
                    <input
                        type="text"
                        placeholder="Paste SPL token mint address…"
                        value={mintB}
                        onChange={(e) => setMintB(e.target.value)}
                        disabled={txStatus === 'pending'}
                        className={
                            'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm ' +
                            'text-slate-100 placeholder-slate-500 font-mono transition-colors ' +
                            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
                            'disabled:cursor-not-allowed disabled:opacity-50'
                        }
                    />
                </div>

                <div>
                    <Label>Amount B wanted</Label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        disabled={txStatus === 'pending'}
                        className={
                            'w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm ' +
                            'text-slate-100 placeholder-slate-500 transition-colors ' +
                            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
                            'disabled:cursor-not-allowed disabled:opacity-50'
                        }
                    />
                </div>
            </fieldset>

            <button
                type="submit"
                disabled={!isValid || txStatus === 'pending'}
                className={
                    'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ' +
                    'bg-blue-600 text-white hover:bg-blue-500 ' +
                    'disabled:cursor-not-allowed disabled:opacity-50'
                }
            >
                {txStatus === 'pending' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                    <><ArrowRightLeft className="h-4 w-4" /> Make Offer</>
                )}
            </button>

            <TransactionStatus status={txStatus} signature={signature} error={txError} />
        </form>
    );
}