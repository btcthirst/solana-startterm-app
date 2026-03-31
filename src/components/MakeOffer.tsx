import { useState } from 'react';
import { useWalletConnection } from '@solana/react-hooks';
import { createWalletTransactionSigner } from '@solana/client';
import { address } from '@solana/kit';
import { ArrowRightLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { getMakeOfferInstructionAsync } from '../generated';
import { executeTransaction } from '../lib/executeTransaction';
import { useTokenAccounts } from '../hooks/useTokenAccounts';
import { useMintDecimals } from '../hooks/useMintDecimals';
import { TokenSelect } from './TokenSelect';
import { TransactionStatus, type TxStatus } from './TransactionStatus';
import type { TokenAccount } from '../lib/helius';
import { Label } from './ui/label';

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

export function MakeOffer() {
    const { connected, wallet } = useWalletConnection();

    const { tokens, loading: tokensLoading, error: tokensError } = useTokenAccounts(
        wallet ? String(wallet.account.address) : null,
    );
    const [tokenA, setTokenA] = useState<TokenAccount | null>(null);
    const [amountA, setAmountA] = useState('');
    const [mintB, setMintB] = useState('');
    const [amountB, setAmountB] = useState('');
    const [txStatus, setTxStatus] = useState<TxStatus>('idle');
    const [signature, setSignature] = useState<string | null>(null);
    const [txError, setTxError] = useState<string | null>(null);

    const mintBDecimals = useMintDecimals(mintB);

    const parsedAmountA = parseFloat(amountA);
    const parsedAmountB = parseFloat(amountB);

    const mintBReady =
        mintB.trim().length >= 32 &&
        !mintBDecimals.loading &&
        !mintBDecimals.error;

    const isValid =
        tokenA !== null &&
        !isNaN(parsedAmountA) &&
        parsedAmountA > 0 &&
        parsedAmountA <= tokenA.balance &&
        mintBReady &&
        !isNaN(parsedAmountB) &&
        parsedAmountB > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || !wallet || !tokenA) return;

        setTxStatus('pending');
        setSignature(null);
        setTxError(null);

        try {
            const {signer} = createWalletTransactionSigner(wallet);

            const ix = await getMakeOfferInstructionAsync({
                maker: signer,
                tokenMintA: address(tokenA.mint),
                tokenMintB: address(mintB.trim() as `${string}`),
                id: BigInt(Date.now()),
                tokenAOfferedAmount: BigInt(Math.round(parsedAmountA * 10 ** tokenA.decimals)),
                tokenBWantedAmount: BigInt(Math.round(parsedAmountB * 10 ** mintBDecimals.decimals)),
            });

            const sig = await executeTransaction(signer, [ix]);
            setSignature(sig);
            setTxStatus('success');
            setTokenA(null);
            setAmountA('');
            setMintB('');
            setAmountB('');
        } catch (err) {
            setTxError(parseError(err));
            setTxStatus('error');
        }
    }

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
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val && tokenA && val.includes('.')) {
                                if (val.split('.')[1].length > tokenA.decimals) return;
                            }
                            setAmountA(val);
                        }}
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
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Paste SPL token mint address..."
                            value={mintB}
                            onChange={(e) => { setMintB(e.target.value); setAmountB(''); }}
                            disabled={txStatus === 'pending'}
                            className={
                                'w-full rounded-lg border bg-slate-800/60 px-3 py-2.5 pr-9 text-sm ' +
                                'text-slate-100 placeholder-slate-500 font-mono transition-colors ' +
                                'focus:outline-none focus:ring-1 ' +
                                (mintBDecimals.error
                                    ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500'
                                    : mintBReady
                                        ? 'border-green-500/60 focus:border-green-500 focus:ring-green-500'
                                        : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500') +
                                ' disabled:cursor-not-allowed disabled:opacity-50'
                            }
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            {mintBDecimals.loading && (
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            )}
                            {!mintBDecimals.loading && mintBReady && (
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                            )}
                        </div>
                    </div>

                    {mintBDecimals.error && mintB.trim().length >= 32 && (
                        <p className="mt-1 text-xs text-red-400">{mintBDecimals.error}</p>
                    )}
                    {mintBReady && (
                        <p className="mt-1 text-xs text-green-400">
                            Mint found — {mintBDecimals.decimals} decimal{mintBDecimals.decimals !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div>
                    <Label>
                        Amount B wanted
                        {mintBReady && (
                            <span className="ml-1 text-slate-500">
                                (max {mintBDecimals.decimals} decimal{mintBDecimals.decimals !== 1 ? 's' : ''})
                            </span>
                        )}
                    </Label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0.00"
                        value={amountB}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val && val.includes('.') && mintBReady) {
                                if (val.split('.')[1].length > mintBDecimals.decimals) return;
                            }
                            setAmountB(val);
                        }}
                        disabled={!mintBReady || txStatus === 'pending'}
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