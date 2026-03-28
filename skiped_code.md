
### 5.4 Як використовувати генерований код

**Make Offer:**
```ts
import { getMakeOfferInstructionAsync } from '@/generated/instructions/makeOffer';

const ix = await getMakeOfferInstructionAsync({
  maker: signer,                        // TransactionSigner
  tokenMintA: address(mintA),           // Address
  tokenMintB: address(mintB),           // Address
  id: BigInt(Date.now()),               // bigint — унікальний ID
  tokenAOfferedAmount: BigInt(rawAmountA),
  tokenBWantedAmount: BigInt(rawAmountB),
  // offer, vault, makerTokenAccountA — деривуються автоматично
});
```

**Take Offer:**
```ts
import { getTakeOfferInstructionAsync } from '@/generated/instructions/takeOffer';

const ix = await getTakeOfferInstructionAsync({
  taker: signer,
  maker: address(offer.data.maker),
  tokenMintA: address(offer.data.tokenMintA),
  tokenMintB: address(offer.data.tokenMintB),
  offer: address(offer.pubkey),   // ← треба передати явно (cross-account seed)
  // інші ATA деривуються автоматично
});
```

### Як отримати signer з гаманця

```ts
import { createWalletTransactionSigner } from '@solana/client';
import { useWalletConnection } from '@solana/react-hooks';

const { wallet } = useWalletConnection();

// В обробнику кліка:
if (!wallet) return;
const { signer } = createWalletTransactionSigner(wallet);
// signer — це TransactionSigner, передай його в executeTransaction
```

### Обробка помилок транзакцій

```ts
export function parseTransactionError(err: unknown): string {
  const msg = (err as { message?: string })?.message ?? String(err);
  if (msg.includes('User rejected')) return 'Transaction rejected by user.';
  if (msg.includes('Blockhash not found')) return 'Transaction expired. Try again.';
  if (msg.includes('insufficient funds')) return 'Insufficient SOL balance.';
  if (msg.includes('0x1')) return 'Insufficient token balance.';
  return msg.slice(0, 120);
}
```