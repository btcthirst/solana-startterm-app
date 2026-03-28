# 🚀 Solana Escrow Frontend: Premium Edition – Покроковий гайд

Цей документ містить повний план того, як відтворити цей проєкт з нуля. Він охоплює всі базові вимоги (нативний код, відсутність web3.js), а також просунуті фічі: **Helius Asset Fetching**, **Vault PDA Balance Parsing**, **WebSockets**, **Skeleton Loaders** та преміальний **Glassmorphism UI**.

---

## Етап 1: Ініціалізація та Конфігурація

### 1. Створення проєкту
Створіть базовий шаблон React з TypeScript через Vite:
```bash
npm create vite@latest solana-escrow-app -- --template react-ts
cd solana-escrow-app
```

### 2. Встановлення залежностей
Замість `@solana/web3.js` використовуємо суто новий `@solana/kit`:
```bash
yarn add @solana/kit @solana/client @solana/react-hooks @solana/spl-token
yarn add react-error-boundary lucide-react clsx tailwind-merge class-variance-authority
```
Встановіть Tailwind CSS v4 та Codama:
```bash
yarn add -D tailwindcss @tailwindcss/vite codama @codama/nodes-from-anchor @codama/renderers-js
```

### 3. Налаштування середовища (`.env`)
Створіть `.env` файл в корені:
```env
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/
VITE_HELIUS_API_KEY=ваш_ключ_від_helius
```

---

## Етап 2: Кодогенерація (Codama)

1. **Скопіюйте IDL:** Збережіть IDL файл нашого смарт-контракту Escrow у `src/lib/escrow-idl.json`.
2. **Створіть скрипт:** Напишіть конфігурацію для Codama в `scripts/codegen.mjs`.
3. **Згенеруйте клієнт:**
   ```bash
   node scripts/codegen.mjs
   ```
   Це створить папку `src/generated`, в якій знаходяться типи `Offer`, методи `getMakeOfferInstructionAsync` та `getTakeOfferInstructionAsync`.

---

## Етап 3: Мережа та Глобальний стан

### 1. Клієнт Solana (`src/lib/solana.ts`)
Налаштуйте `createClient` для `@solana/client`, щоб він автоматично знаходив розширення гаманців (Phantom, Solflare, Backpack) через `autoDiscover()`.

### 2. RPC та WebSockets (`src/lib/rpc.ts`)
Ініціалізуйте `createSolanaRpc` та `createSolanaRpcSubscriptions` з використанням URL з `.env`. Це знадобиться нам для кастомних запитів балансу та авто-оновлення списку оферів.

### 3. Провайдер (`src/main.tsx`)
Обгорніть `App` компонентом `<SolanaProvider client={solanaClient}>`.

---

## Етап 4: Інтеграція смарт-даних (Helius)

### 1. Метадані токенів (`src/lib/helius.ts`)
Створіть функції для Helius DAS (Digital Asset Standard):
- `getTokenAccounts(ownerAddress)`: Завантажує токени юзера через метод `getAssetsByOwner`.
- `getAssetBatch(mints)`: Достає логотипи, символи і справжні `decimals` для списку невідомих мінт-адрес (щоб показувати іконки токенів у карточках).

### 2. Декодування оферів (`src/lib/fetchOffers.ts`)
1. Використайте `rpc.getProgramAccounts` з фільтром на `OFFER_DISCRIMINATOR`.
2. Знайдіть **Vault PDA** для кожного оферу, використовуючи `getProgramDerivedAddress`.
3. Запитайте фактичний баланс кожного Vault через `rpc.getTokenAccountBalance()`.
4. Об'єднайте отримані дані з метаданими з `getAssetBatch`, щоб на виході отримати готові для UI об'єкти з логотипами, символами і правильними балансами у `uiAmount`.

---

## Етап 5: UI/UX та Дизайн-система

### 1. Преміум-дизайн (`index.css` & `App.tsx`)
Налаштуйте Glassmorphism. В `App.tsx` додайте глобальний фон:
```tsx
bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]
```
Обгорніть головний контент у `<GlobalErrorBoundary>`, щоб гарантувати 100% стабільність. Додайте Tab-перемикач між Make Offer та Take Offer.

### 2. Кастомний гаманець (`src/components/WalletButton.tsx`)
Побудуйте Dropdown-меню з нуля за допомогою `lucide-react`. Виводьте скорочену адресу та баланс (якщо підключено) або список доступних гаманців (якщо ні). Використовуйте `useWalletConnection()`.

---

## Етап 6: Бізнес-логіка додатку

### 1. Створення Оферу (`src/components/MakeOffer.tsx`)
- Створіть 2 поля: "You offer (Token A)" і "You want (Token B)".
- **Валідація Input'ів:** Захистіть ввід `Token A` так, щоб користувач не міг ввести більше знаків після коми, ніж дозволяє `tokenA.decimals`.
- **Транзакція:** Отримайте сід (`BigInt(Date.now())`) і виконайте `getMakeOfferInstructionAsync`. Підпишіть її за допомогою `createWalletTransactionSigner(wallet)` і надішліть.

### 2. Відображення списку (`src/components/TakeOffer.tsx`)
- Реалізуйте стейт `loading`. Замість нудного спінера додайте компонент-заглушку **Skeleton Loaders**, що імітує мерехтливі картки `animate-pulse`.
- Окремо відокремте візуальну карточку у `src/components/ui/offerCard.tsx`. Надайте їй стилі Glassmorphism: `bg-slate-900/40 backdrop-blur-md border border-white/10 hover:shadow-indigo-500/10`.
- **Take Transaction:** При натисканні "Take Offer" явно передавайте адресу поточного офферу у метод `getTakeOfferInstructionAsync`, оскільки Codama не може знайти seed автоматично.

### 3. WebSockets Auto-Refresh
У `TakeOffer.tsx` використайте експортований `rpcSubscriptions.programNotifications`, щоб слухати `ESCROW_PROGRAM_ADDRESS`:
```tsx
const notifications = await rpcSubscriptions.programNotifications(...).subscribe(...);
for await (const notif of notifications) {
  setTimeout(() => loadOffers(), 500); // Оновлення після події на блокчейні
}
```
Це гарантує, що якщо хтось викупить оферту, вона одразу ж зникне у всіх інших користувачів у реальному часі.

---

## Резюме
Проєкт, побудований за цим планом, не лише закриває всі [GOALS.md], але й значно перевершує їх за рівнем інтерактивності, безпеки введення (Error Boundaries + Validation) та візуальної привабливості.
