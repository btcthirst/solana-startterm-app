# TASK.md — Solana SPL Token Escrow Frontend

Покроковий гайд для самостійного створення React-фронтенду для escrow-програми на Solana Devnet.

---

## Зміст

1. [Огляд проєкту](#1-огляд-проєкту)
2. [Технічний стек](#2-технічний-стек)
3. [Архітектура та структура файлів](#3-архітектура-та-структура-файлів)
4. [Крок 1 — Ініціалізація проєкту](#крок-1--ініціалізація-проєкту)
5. [Крок 2 — Встановлення залежностей](#крок-2--встановлення-залежностей)
6. [Крок 3 — Конфігурація Vite та TypeScript](#крок-3--конфігурація-vite-та-typescript)
7. [Крок 4 — Змінні середовища (.env)](#крок-4--змінні-середовища-env)
8. [Крок 5 — Codama: генерація TypeScript-клієнта з IDL](#крок-5--codama-генерація-typescript-клієнта-з-idl)
9. [Крок 6 — Solana провайдер і RPC](#крок-6--solana-провайдер-і-rpc)
10. [Крок 7 — Виконання транзакцій](#крок-7--виконання-транзакцій)
11. [Крок 8 — Токен-акаунти через Helius DAS](#крок-8--токен-акаунти-через-helius-das)
12. [Крок 9 — Отримання всіх Offer-акаунтів](#крок-9--отримання-всіх-offer-акаунтів)
13. [Крок 10 — UI-компоненти](#крок-10--ui-компоненти)
14. [Крок 11 — Кастомний Wallet Modal](#крок-11--кастомний-wallet-modal)
15. [Крок 12 — Make Offer форма](#крок-12--make-offer-форма)
16. [Крок 13 — Take Offer список](#крок-13--take-offer-список)
17. [Крок 14 — App.tsx і main.tsx](#крок-14--apptsx-і-maintsx)
18. [Крок 15 — Збірка і деплой](#крок-15--збірка-і-деплой)
19. [Часті помилки і рішення](#часті-помилки-і-рішення)
20. [Критерії оцінювання](#критерії-оцінювання)

---

## 1. Огляд проєкту

Потрібно побудувати мінімальний, але повністю функціональний інтерфейс для SPL-token escrow програми на Solana Devnet.

**Програма:** `4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy`

### Що повинно вміти:

- **Make Offer** — користувач підключає гаманець, вибирає Token A зі свого балансу, вказує кількість та mint Token B, який хоче отримати. При сабміті — формується і відправляється `make_offer` інструкція на Devnet.
- **Take Offer** — завантажуються всі відкриті Offer-акаунти програми, відображаються карточками. Кнопка "Take" відправляє `take_offer` інструкцію.

---

## 2. Технічний стек

| Що                     | Пакет                                                          | Версія         |
|------------------------|----------------------------------------------------------------|----------------|
| Бандлер                | `vite`                                                         | ^6.0           |
| UI фреймворк           | `react` + `react-dom`                                          | ^18.3          |
| Мова                   | `typescript`                                                   | ~5.7           |
| Solana клієнт          | `@solana/kit`                                                  | ^6.5.0         |
| Wallet connection      | `@solana/client` + `@solana/react-hooks`                       | ^1.7 / ^1.4    |
| IDL → TS кодогенерація | `codama` + `@codama/nodes-from-anchor` + `@codama/renderers-js`| ^1.5           |
| Token metadata         | `@solana/spl-token`                                            | ^0.4           |
| CSS                    | Tailwind CSS v4                                                | ^4.0           |
| Іконки                 | `lucide-react`                                                 | ^0.469         |
| UI утиліти             | `clsx` + `tailwind-merge` + `class-variance-authority`         | latest         |

> ⚠️ **Заборонено:** `@solana/web3.js` та сторонні UI-бібліотеки для wallet modal (RainbowKit, Wallet Adapter UI тощо).

---

## 3. Архітектура та структура файлів

```
escrow-frontend/
├── public/
├── scripts/
│   └── codegen.mjs              # Codama кодогенерація з IDL
├── src/
│   ├── generated/               # ← Auto-generated Codama client (не редагувати!)
│   │   ├── accounts/offer.ts    # decodeOffer, OFFER_DISCRIMINATOR, type Offer
│   │   ├── instructions/
│   │   │   ├── makeOffer.ts     # getMakeOfferInstructionAsync()
│   │   │   └── takeOffer.ts     # getTakeOfferInstructionAsync()
│   │   ├── pdas/offer.ts        # findOfferPda()
│   │   ├── programs/escrow.ts   # ESCROW_PROGRAM_ADDRESS
│   │   └── index.ts
│   ├── lib/
│   │   ├── solana.ts            # createClient() — єдиний екземпляр
│   │   ├── rpc.ts               # createSolanaRpc() + createSolanaRpcSubscriptions()
│   │   ├── helius.ts            # getTokenAccounts() через Helius DAS API
│   │   ├── fetchOffers.ts       # fetchAllOffers() через getProgramAccounts
│   │   ├── executeTransaction.ts # executeTransaction() — підпис + відправка
│   │   ├── escrow-idl.json      # IDL файл програми
│   │   └── utils.ts             # cn(), shortenAddress()
│   ├── hooks/
│   │   └── useTokenAccounts.ts  # React hook для токенів гаманця
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx       # shadcn-style Button
│   │   │   └── card.tsx         # Card, CardHeader, CardTitle, CardContent
│   │   ├── WalletButton.tsx     # Кастомний wallet modal (без бібліотек!)
│   │   ├── TokenSelect.tsx      # Dropdown для вибору токена
│   │   ├── TransactionStatus.tsx # idle/pending/success/error стани
│   │   ├── MakeOffer.tsx        # Форма Make Offer
│   │   └── TakeOffer.tsx        # Список офферів + Take кнопки
│   ├── App.tsx                  # Головний layout з tabs
│   ├── main.tsx                 # Entry point з SolanaProvider
│   ├── index.css                # Tailwind v4 import
│   └── vite-env.d.ts            # /// <reference types="vite/client" />
├── index.html
├── vite.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── package.json
├── .env                         # Не коміт! (є в .gitignore)
├── .env.example
└── README.md
```

---

## Крок 1 — Ініціалізація проєкту

```bash
npm create vite@latest escrow-frontend -- --template react-ts
cd escrow-frontend
```

Одразу створити потрібні папки:

```bash
mkdir -p src/lib src/hooks src/components/ui src/generated scripts public
```

---

## Крок 2 — Встановлення залежностей

```bash
# Runtime залежності
npm install \
  @solana/kit@^6.5.0 \
  @solana/client@^1.7.0 \
  @solana/react-hooks@^1.4.1 \
  @solana/spl-token@^0.4.14 \
  @radix-ui/react-dialog \
  @radix-ui/react-select \
  @radix-ui/react-label \
  @radix-ui/react-slot \
  @radix-ui/react-tabs \
  class-variance-authority \
  clsx \
  lucide-react \
  tailwind-merge

# Dev залежності
npm install -D \
  @tailwindcss/vite@^4.0.6 \
  tailwindcss@^4.0.6 \
  codama@^1.5.1 \
  @codama/nodes-from-anchor@^1.4.0 \
  @codama/renderers-js@^1.4.4 \
  @vitejs/plugin-react \
  typescript \
  vite
```

---

## Крок 3 — Конфігурація Vite та TypeScript

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // КРИТИЧНО: Solana пакети використовують `global`, якого немає в браузері
  define: { global: 'globalThis' },
});
```

### `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

> ⚠️ **Важливо:** НЕ додавай `"erasableSyntaxOnly": true` — Codama генерує звичайні TypeScript enum-и, які з цією опцією не компілюються.

### `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />
```

Цей файл дає тип для `import.meta.env`.

### `src/index.css`

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  background-color: #0f172a;
  color: #f1f5f9;
  font-family: system-ui, -apple-system, sans-serif;
}
```

---

## Крок 4 — Змінні середовища (.env)

Скопіюй `.env.example` в `.env`:

```bash
cp .env.example .env
```

Вміст `.env`:
```
VITE_HELIUS_API_KEY=your_helius_api_key_here
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your_key
VITE_SOLANA_WS_URL=wss://devnet.helius-rpc.com/?api-key=your_key
```

> Безкоштовний Helius ключ: https://dashboard.helius.dev
> Без ключа додаток теж працює через публічний RPC, але токен-метадані будуть обмежені.

---

## Крок 5 — Codama: генерація TypeScript-клієнта з IDL

### 5.1 Збережи IDL

Збережи IDL програми як `src/lib/escrow-idl.json`. Ключові поля які потрібно перевірити:

```json
{
  "address": "4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy",
  "instructions": [
    {
      "name": "make_offer",
      "discriminator": [214, 98, 97, 35, 59, 12, 44, 178],
      ...
    },
    {
      "name": "take_offer",
      "discriminator": [128, 156, 242, 207, 237, 192, 103, 240],
      ...
    }
  ],
  "accounts": [
    { "name": "Offer", "discriminator": [215, 88, 60, 71, 170, 162, 73, 229] }
  ],
  "types": [
    {
      "name": "Offer",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "id", "type": "u64" },
          { "name": "maker", "type": "pubkey" },
          { "name": "token_mint_a", "type": "pubkey" },
          { "name": "token_mint_b", "type": "pubkey" },
          { "name": "token_b_wanted_amount", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
}
```

### 5.2 Створи скрипт `scripts/codegen.mjs`

```js
import { readFileSync } from 'fs';
import { createFromRoot } from 'codama';
import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
import { renderVisitor } from '@codama/renderers-js';

const idl = JSON.parse(readFileSync('./src/lib/escrow-idl.json', 'utf-8'));
const codama = createFromRoot(rootNodeFromAnchor(idl));
codama.accept(renderVisitor('./src/generated', { deleteFolderBeforeRendering: true }));
console.log('✅ Codama client generated → src/generated/');
```

Додай в `package.json`:
```json
"scripts": {
  "codegen": "node scripts/codegen.mjs"
}
```

### 5.3 Запусти кодогенерацію

```bash
npm run codegen
```

Після запуску з'явиться `src/generated/` з такою структурою:
```
src/generated/
├── accounts/offer.ts       → type Offer, OFFER_DISCRIMINATOR, getOfferDecoder()
├── instructions/
│   ├── makeOffer.ts        → getMakeOfferInstructionAsync()
│   └── takeOffer.ts        → getTakeOfferInstructionAsync()
├── pdas/offer.ts           → findOfferPda(maker, id)
├── programs/escrow.ts      → ESCROW_PROGRAM_ADDRESS
└── index.ts
```

> ⚠️ **Не редагуй** файли в `src/generated/` — вони перезаписуються при `npm run codegen`.

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

---

## Крок 6 — Solana провайдер і RPC

### `src/lib/solana.ts` — єдиний createClient

```ts
import { createClient, autoDiscover } from '@solana/client';

const endpoint: string = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const websocketEndpoint: string =
  import.meta.env.VITE_SOLANA_WS_URL ??
  endpoint.replace('https://', 'wss://').replace('http://', 'ws://');

export const solanaClient = createClient({
  endpoint,
  websocketEndpoint,
  walletConnectors: autoDiscover(),  // автоматично знаходить всі Wallet Standard гаманці
});
```

> ⚠️ **Правило:** `createClient()` викликається **один раз** за межами компонентів. Ніколи всередині компонента або хука.

### `src/lib/rpc.ts` — RPC для ручних запитів

```ts
import { createSolanaRpc, createSolanaRpcSubscriptions, devnet } from '@solana/kit';

const rpcUrl: string = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const wsUrl: string = import.meta.env.VITE_SOLANA_WS_URL ?? rpcUrl.replace('https://', 'wss://');

export const rpc = createSolanaRpc(devnet(rpcUrl));
export const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(wsUrl));
```

### `src/main.tsx` — обгортка SolanaProvider

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SolanaProvider } from '@solana/react-hooks';
import { solanaClient } from '@/lib/solana'; // запитання щодо "@" чому не "./lib/solana"?
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider client={solanaClient}>
      <App />
    </SolanaProvider>
  </StrictMode>,
);
```

---

## Крок 7 — Виконання транзакцій

### `src/lib/executeTransaction.ts`

```ts
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
import { rpc, rpcSubscriptions } from '@/lib/rpc';

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
---

## Крок 8 — Токен-акаунти через Helius DAS

Helius DAS API повертає токени з метаданими (назва, символ, лого).

### `src/lib/helius.ts`

```ts
const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY ?? '';
const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

export const HELIUS_RPC = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : RPC_URL;

export interface TokenAccount {
  mint: string;
  symbol: string;
  name: string;
  logo?: string;
  balance: number;      // human-readable (поділено на decimals)
  rawBalance: bigint;   // raw on-chain bigint
  decimals: number;
  tokenAccount: string; // ATA адреса
}

async function heliusPost(method: string, params: unknown) {
  const resp = await fetch(HELIUS_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  });
  const json = await resp.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

export async function getTokenAccounts(ownerAddress: string): Promise<TokenAccount[]> {
  const result = await heliusPost('getAssetsByOwner', {
    ownerAddress,
    page: 1,
    limit: 100,
    displayOptions: { showFungible: true, showNativeBalance: false },
  });

  return (result?.items ?? [])
    .filter((item: any) => (item.token_info?.balance ?? 0) > 0)
    .map((item: any) => {
      const ti = item.token_info;
      const decimals = ti.decimals ?? 6;
      const rawBalance = BigInt(Math.round(ti.balance ?? 0));
      return {
        mint: item.id,
        symbol: ti.symbol || item.content?.metadata?.symbol || item.id.slice(0, 4) + '…',
        name: item.content?.metadata?.name || ti.symbol || item.id,
        logo: item.content?.links?.image,
        balance: Number(rawBalance) / 10 ** decimals,
        rawBalance,
        decimals,
        tokenAccount: ti.associated_token_address ?? '',
      };
    });
}
```

### React hook `src/hooks/useTokenAccounts.ts`

```ts
import { useState, useEffect } from 'react';
import { getTokenAccounts, type TokenAccount } from '@/lib/helius';

export function useTokenAccounts(ownerAddress: string | null) {
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerAddress) { setTokens([]); return; }
    let cancelled = false;
    setLoading(true);
    getTokenAccounts(ownerAddress)
      .then(r => { if (!cancelled) setTokens(r); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ownerAddress]);

  return { tokens, loading, error };
}
```

---

## Крок 9 — Отримання всіх Offer-акаунтів

`src/lib/fetchOffers.ts` — використовує `getProgramAccounts` з discriminator фільтром.

```ts
import { address, getBase58Codec, type Address } from '@solana/kit';
import { rpc } from '@/lib/rpc';
import { OFFER_DISCRIMINATOR, getOfferDecoder, type Offer } from '@/generated/accounts/offer';
import { ESCROW_PROGRAM_ADDRESS } from '@/generated/programs/escrow';

export interface OfferAccount { pubkey: string; data: Offer; }

export async function fetchAllOffers(): Promise<OfferAccount[]> {
  // OFFER_DISCRIMINATOR = [215, 88, 60, 71, 170, 162, 73, 229]
  // Перетворюємо в base58 для memcmp фільтра
  const discriminatorB58 = getBase58Codec().decode(OFFER_DISCRIMINATOR) as unknown as `${string}`;

  const response = await (rpc.getProgramAccounts as any)(
    address(ESCROW_PROGRAM_ADDRESS) as Address,
    {
      encoding: 'base64',
      filters: [{
        memcmp: { offset: 0n, bytes: discriminatorB58, encoding: 'base58' },
      }],
    },
  ).send();

  const decoder = getOfferDecoder();

  return (response as any[]).flatMap((item: any) => {
    try {
      const dataBytes = Buffer.from(item.account.data[0], 'base64');
      const offer = decoder.decode(new Uint8Array(dataBytes));
      return [{ pubkey: item.pubkey, data: offer }];
    } catch { return []; }
  });
}
```

> **Примітка:** `getBase58Codec().decode()` конвертує `Uint8Array` → `string` (base58). Саме цей рядок передається в `memcmp.bytes`.

---

## Крок 10 — UI-компоненти

### `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(addr: string, chars = 4): string {
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}
```

### `src/components/ui/button.tsx` — shadcn-style кнопка

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-500',
        destructive: 'bg-red-600 text-white hover:bg-red-500',
        outline: 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700',
        ghost: 'text-slate-300 hover:bg-slate-800',
        success: 'bg-green-600 text-white hover:bg-green-500',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### `src/components/TransactionStatus.tsx`

Компонент відображає 4 стани: `idle` (нічого), `pending` (спінер), `success` (зелена галочка + Explorer link), `error` (червоний хрестик + текст помилки).

```tsx
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function TransactionStatus({ status, signature, error }: {
  status: TxStatus; signature?: string | null; error?: string | null;
}) {
  if (status === 'idle') return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
      {status === 'pending' && (
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending transaction…
        </div>
      )}
      {status === 'success' && signature && (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Transaction confirmed!
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank" rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-start gap-2 text-red-400">
          <XCircle className="h-4 w-4 mt-0.5" />
          {error ?? 'Transaction failed'}
        </div>
      )}
    </div>
  );
}
```

---

## Крок 11 — Кастомний Wallet Modal

> ⚠️ **Вимога баунті:** NO third-party wallet UI libraries. Тільки власний код.

### Як працює `useWalletConnection`

```ts
const {
  connected,    // boolean
  connectors,   // WalletConnector[] — всі знайдені гаманці
  connect,      // (connectorId: string) => Promise<WalletSession>
  disconnect,   // () => void
  wallet,       // WalletSession | undefined
} = useWalletConnection();
```

### Важливі нюанси

- `connect` приймає **рядок-ID** (не об'єкт): `connect(c.id)`
- `connectors[i].id` — унікальний рядок (наприклад `"wallet-standard:phantom"`)
- `connectors[i].name` — відображувана назва (`"Phantom"`)
- `connectors[i].icon` — data URI лого (може бути `undefined`)
- `wallet.account.address` — не рядок, треба `String(wallet.account.address)`
- `wallet.connector?.icon` і `wallet.connector?.name` — метадані підключеного гаманця

### Шаблон Modal

```tsx
// Показуємо кнопку "Connect Wallet" якщо не підключений
// При кліку — відкриваємо modal з списком connectors
// Для кожного connector.id — кнопка з іконкою і назвою
// При кліку: connect(connector.id) + закрити modal

connectors.map(c => (
  <button key={c.id} onClick={() => { connect(c.id); setShowModal(false); }}>
    {c.icon && <img src={c.icon} />}
    {c.name}
  </button>
))
```

---

## Крок 12 — Make Offer форма

### Логіка компонента `MakeOffer.tsx`

1. `useWalletConnection()` — отримати `wallet` і `connected`
2. `useTokenAccounts(walletAddress)` — завантажити токени гаманця
3. `TokenSelect` — показати dropdown для вибору Token A
4. Input для `amountA` (кількість Token A), з кнопкою MAX
5. Input для `mintB` (mint адреса Token B, яку хоче отримати)
6. Input для `amountB` (кількість Token B)
7. При кліку Submit:
   ```ts
   const { signer } = createWalletTransactionSigner(wallet);
   const ix = await getMakeOfferInstructionAsync({
     maker: signer,
     tokenMintA: address(tokenA.mint),
     tokenMintB: address(mintB),
     id: BigInt(Date.now()),
     tokenAOfferedAmount: BigInt(Math.round(amountA * 10 ** tokenA.decimals)),
     tokenBWantedAmount: BigInt(Math.round(amountB * 10 ** 6)),
   });
   const sig = await executeTransaction(signer, [ix]);
   ```

### Стани

```ts
const [txStatus, setTxStatus] = useState<TxStatus>('idle');
const [signature, setSignature] = useState<string | null>(null);
const [txError, setTxError] = useState<string | null>(null);
```

---

## Крок 13 — Take Offer список

### Логіка компонента `TakeOffer.tsx`

1. `fetchAllOffers()` при mount — завантажити всі відкриті оффери
2. Кнопка Refresh — перезавантажити
3. Для кожного оффера показати карточку:
   - pubkey (скорочений)
   - Token A mint (скорочений)
   - Token B mint (скорочений) + потрібна кількість
   - Maker адреса (скорочена)
4. Кнопка "Take Offer":
   ```ts
   const { signer } = createWalletTransactionSigner(wallet);
   const ix = await getTakeOfferInstructionAsync({
     taker: signer,
     maker: address(offer.data.maker),
     tokenMintA: address(offer.data.tokenMintA),
     tokenMintB: address(offer.data.tokenMintB),
     offer: address(offer.pubkey),   // ← передати явно!
   });
   const sig = await executeTransaction(signer, [ix]);
   ```

> ⚠️ **Важливо:** `offer` потрібно передавати явно в `getTakeOfferInstructionAsync`, бо IDL використовує `offer.id` як seed (cross-account reference), і Codama не може дерайвити автоматично.

---

## Крок 14 — App.tsx і main.tsx

### App.tsx — tabs layout

```tsx
import { useState } from 'react';
import { WalletButton } from '@/components/WalletButton';
import { MakeOffer } from '@/components/MakeOffer';
import { TakeOffer } from '@/components/TakeOffer';

type Tab = 'make' | 'take';

export default function App() {
  const [tab, setTab] = useState<Tab>('make');
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 sticky top-0 z-40 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 flex justify-between">
          <h1>Escrow · Devnet</h1>
          <WalletButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-slate-900/50 p-1 mb-6">
          <button onClick={() => setTab('make')}>⬆ Make Offer</button>
          <button onClick={() => setTab('take')}>⬇ Take Offer</button>
        </div>
        {tab === 'make' ? <MakeOffer /> : <TakeOffer />}
      </main>
    </div>
  );
}
```

---

## Крок 15 — Збірка і деплой

### Локальний запуск

```bash
npm run dev
# → http://localhost:5173
```

### Продакшн збірка

```bash
npm run build
# → dist/
```

### Деплой на Vercel (рекомендовано)

```bash
# Встанови Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

Або через GitHub:
1. Push проєкт на GitHub
2. Зайди на vercel.com → New Project → Import з GitHub
3. Framework: Vite, Build Command: `npm run build`, Output: `dist`
4. Додай Environment Variables (VITE_HELIUS_API_KEY, VITE_SOLANA_RPC_URL, VITE_SOLANA_WS_URL)
5. Deploy

### README.md — що потрібно вказати для сабмісії

- [ ] Setup інструкції (clone → npm install → cp .env.example .env → npm run dev)
- [ ] Список протестованих гаманців (Phantom ✅, Backpack ✅, Solflare ✅)
- [ ] Посилання на Devnet транзакцію `make_offer`
- [ ] Посилання на Devnet транзакцію `take_offer`

---

## Часті помилки і рішення

### ❌ `Cannot find module '@solana/web3.js'`
Цей пакет заборонений! Всюди використовуй `@solana/kit` і `@solana/client`.

### ❌ `global is not defined`
Додай в `vite.config.ts`:
```ts
define: { global: 'globalThis' }
```

### ❌ `IInstruction is not exported from @solana/kit`
Правильна назва типу: `Instruction` (без `I`-префіксу в v6).

### ❌ `import.meta.env` має тип `any` або не існує
Додай `src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

### ❌ `connect is not a function` або `connect(connector)` не працює
`useWalletConnection().connect` приймає рядок-ID, не об'єкт:
```ts
connect(c.id)  // ✅ правильно
connect(c)     // ❌ неправильно
```

### ❌ Wallet address не відображається як рядок
```ts
String(wallet.account.address)  // ✅
wallet.account.address          // ❌ це не просто string
```

### ❌ `getProgramAccounts` TypeScript error з memcmp bytes
Тип `bytes` в memcmp строго типізований. Рішення:
```ts
const bytes = getBase58Codec().decode(OFFER_DISCRIMINATOR) as unknown as `${string}`;
```

### ❌ Codama генерує enum — помилка `erasableSyntaxOnly`
Не додавай `"erasableSyntaxOnly": true` в tsconfig. Codama генерує `enum`, що несумісно з цією опцією.

### ❌ `take_offer` transaction fails
Переконайся що передаєш `offer: address(offer.pubkey)` явно — без цього Codama не може дерайвити PDA бо seed `offer.id` вимагає читання даних акаунта.

### ❌ Token A не відображається в списку
Helius DAS повертає тільки токени з балансом > 0. Для тестів отримай тестові токени на Devnet:
```bash
# Сминтуй токени через spl-token CLI
spl-token create-token --decimals 6
spl-token create-account <MINT>
spl-token mint <MINT> 1000
```

---

## Критерії оцінювання

| Критерій                              | Вага    | Що перевіряється |
|---------------------------------------|---------|-------------------|
| Транзакції на Devnet (make + take)    | **35%** | Реальні підписані транзакції на Devnet explorer |
| UI/UX (помилки, лоадери, стани)       | **20%** | Loading під час запитів, distinct error messages, disabled buttons |
| Кастомний wallet modal                | **15%** | Без RainbowKit/Wallet Adapter UI, власний dropdown з іконками |
| Живий деплой                          | **15%** | Vercel/Netlify/GitHub Pages — публічний URL, без локального запуску |
| Якість коду і TypeScript              | **15%** | Суворий TypeScript, правильні типи, чиста структура |

> ❌ Автоматична дискваліфікація: використання `@solana/web3.js` або сторонніх wallet modal бібліотек.