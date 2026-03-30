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
 * Prepares, signs, and executes a Solana transaction.
 * This function handles blockhash fetching, message construction, and confirmation.
 * 
 * @param signer - The transaction signer (typically the connected wallet).
 * @param instructions - An array of instructions to include in the transaction.
 * @returns A promise resolving to the transaction signature in base58 format.
 */
export async function executeTransaction(
    signer: TransactionSigner,
    instructions: Instruction[],
): Promise<string> {
    // Fetch the most recent blockhash for transaction validity
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Construct the versioned transaction message
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

    // Request the wallet to sign the transaction (triggers popup)
    const signed = await signTransactionMessageWithSigners(message);

    // Submit and wait for the transaction to be confirmed on-chain
    await (sendAndConfirm as (tx: typeof signed, opts: object) => Promise<void>)(
        signed, { commitment: 'confirmed' },
    );

    // Decode and return the transaction signature for the explorer link
    const sigBytes = Object.values(signed.signatures)[0] as Uint8Array;
    return getBase58Codec().decode(sigBytes);
}