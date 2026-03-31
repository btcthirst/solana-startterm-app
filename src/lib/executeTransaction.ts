import {
    createTransactionMessage,
    appendTransactionMessageInstructions,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    sendAndConfirmTransactionFactory,
    getBase58Codec,
    type TransactionSigner,
    type Instruction,
} from '@solana/kit';
import { rpc, rpcSubscriptions } from './rpc';

const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

/**
 * Checks whether a caught error is a "blockhash not found / expired" error.
 * @solana/kit throws a SolanaError with code -32002 or a message containing
 * "Blockhash not found" when the lifetime has expired on-chain.
 */
function isBlockhashExpiredError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return (
        msg.includes('blockhash not found') ||
        msg.includes('blockhash') ||
        // JSON-RPC error code that Helius / mainnet validators return
        msg.includes('-32002')
    );
}

/**
 * Prepares, signs, and executes a Solana transaction.
 * Automatically retries once if the blockhash expires between fetch and
 * submission — a common occurrence on Devnet where slot times vary.
 *
 * @param signer       - The transaction signer (connected wallet).
 * @param instructions - Instructions to include in the transaction.
 * @param maxRetries   - How many times to retry on a stale-blockhash error
 *                       (default: 2, giving a total of 3 attempts).
 * @returns The transaction signature in base58 format.
 */
export async function executeTransaction(
    signer: TransactionSigner,
    instructions: Instruction[],
    maxRetries = 2,
): Promise<string> {
    let attempt = 0;

    while (true) {
        attempt++;

        // Always fetch a fresh blockhash at the start of each attempt.
        const { value: latestBlockhash } = await rpc
            .getLatestBlockhash({ commitment: 'confirmed' })
            .send();

        const message = setTransactionMessageFeePayerSigner(
            signer,
            setTransactionMessageLifetimeUsingBlockhash(
                latestBlockhash,
                appendTransactionMessageInstructions(
                    instructions,
                    createTransactionMessage({ version: 0 }),
                ),
            ),
        );

        // signTransactionMessageWithSigners triggers the wallet popup.
        // We do NOT retry after a user rejection — that is a terminal error.
        const signed = await signTransactionMessageWithSigners(message);

        try {
            await (sendAndConfirm as (tx: typeof signed, opts: object) => Promise<void>)(
                signed,
                { commitment: 'confirmed' },
            );

            // Decode and return the base58 signature.
            const sigBytes = Object.values(signed.signatures)[0] as Uint8Array;
            return getBase58Codec().decode(sigBytes);
        } catch (err) {
            // Only retry on blockhash expiry; everything else bubbles up immediately.
            if (isBlockhashExpiredError(err) && attempt <= maxRetries) {
                // Brief pause so the validator moves to the next slot before we retry.
                await new Promise((resolve) => setTimeout(resolve, 800));
                continue;
            }
            throw err;
        }
    }
}