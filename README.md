# Solana SPL Token Escrow Frontend

A fully functional React frontend for the SPL-token escrow program on Solana Devnet.

**Program address:** `4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy`

## Features

- **Make Offer** — lock Token A in a vault and specify the amount of Token B you want
- **Take Offer** — browse all open offers and accept one, completing the atomic swap
- **Custom wallet modal** — auto-detects all Wallet Standard wallets (Phantom, Backpack, Solflare, etc.) with no third-party UI libraries
- Full loading states, error handling, and Solana Explorer links for every transaction

## Tech Stack

| Layer | Package |
|-------|---------|
| Bundler | Vite + React + TypeScript |
| Solana client | `@solana/kit` (Anza kit) — no `@solana/web3.js` |
| Wallet connection | `@solana/client` + `@solana/react-hooks` |
| IDL → TypeScript | Codama (`codama`, `@codama/nodes-from-anchor`, `@codama/renderers-js`) |
| Styling | Tailwind CSS v4 + shadcn-style components |

## Setup

### 1. Clone & install

```bash
git clone <your-repo-url>
cd escrow-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your [Helius API key](https://dashboard.helius.dev) (free tier works).
The app runs without a key using the public Devnet RPC, but token metadata (names/symbols/logos) will be limited.

### 3. Regenerate Codama client (optional)

The generated client is committed to `src/generated/`. To regenerate from the IDL:

```bash
npm run codegen
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Build for production

```bash
npm run build
```

## Wallets Tested

- **Phantom** (Chrome extension) ✅
- **Backpack** (Chrome extension) ✅
- **Solflare** (Chrome extension) ✅

## Devnet Transaction Examples

> Add your `make_offer` or `take_offer` transaction link here after your first test:

- `make_offer`: https://explorer.solana.com/tx/YOUR_TX_SIGNATURE?cluster=devnet
- `take_offer`: https://explorer.solana.com/tx/YOUR_TX_SIGNATURE?cluster=devnet

## Notes

- All transactions execute on **Solana Devnet only**
- Use `npm run codegen` any time you need to re-generate the TypeScript client from the IDL
- The offer ID is derived from `Date.now()` (milliseconds) to ensure uniqueness per wallet