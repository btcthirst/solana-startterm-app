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

export async function executeTransaction(
    signer: TransactionSigner,
    instructions: Instruction[],
): Promise<string> {
    // 1. Отримати свіжий blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // 2. Побудувати повідомлення транзакції
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

    // 3. Підписати (відкриє popup гаманця)
    const signed = await signTransactionMessageWithSigners(message);

    // 4. Відправити і чекати підтвердження
    await (sendAndConfirm as (tx: typeof signed, opts: object) => Promise<void>)(
        signed, { commitment: 'confirmed' },
    );

    // 5. Повернути підпис у base58 (для Explorer link)
    const sigBytes = Object.values(signed.signatures)[0] as Uint8Array;
    return getBase58Codec().decode(sigBytes);
}