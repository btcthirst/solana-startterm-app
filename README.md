# Solana SPL Token Escrow Frontend

A modern, fully functional Web3 frontend for the SPL-token escrow program on Solana Devnet. Built specifically for the Superteam Ukraine Solana Startup Terminal program.

> **Program Address:** `4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy`

## 🌟 Features

- **Make Offer** — Lock `Token A` in a vault and specify the exact amount of `Token B` you want in return.
- **Take Offer** — Browse all open offers in real-time. Instantly accept one, completing the atomic swap securely on-chain.
- **Dynamic Vault Parsing** — Derives the ATA vault PDA on-chain to display the exact locked `Token A` balance.
- **Helius Asset Integration** — Resolves raw mint addresses into human-readable symbols, names, decimals, and logos via the DAS API.
- **Custom Wallet Modal** — Built from scratch. Auto-detects Wallet Standard compatible wallets (Phantom, Backpack, Solflare) without any third-party UI library.
- **Glassmorphism UX** — Loading skeletons, hover animations, WebSocket real-time refresh, and comprehensive error handling.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Core** | Vite + React 19 + TypeScript |
| **Solana Client** | `@solana/kit` (Anza kit) — **no `@solana/web3.js`** |
| **Wallet Connection** | `@solana/react-hooks` |
| **Transaction Decoding** | Codama (`codama`, `@codama/nodes-from-anchor`, `@codama/renderers-js`) |
| **Styling** | Tailwind CSS v4 |

---

## 🚀 Setup Instructions

### 1. Clone & install dependencies

```bash
git clone <your-repo-url>
cd solana-startterm-app
yarn install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Helius API key (free tier works fine):

```env
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_SOLANA_WS_URL=wss://devnet.helius-rpc.com/?api-key=YOUR_KEY
VITE_HELIUS_API_KEY=YOUR_KEY
```

> Without a Helius key the app falls back to `https://api.devnet.solana.com` — token logos and symbols won't resolve, but all transactions will still work.

### 3. Get Devnet SOL

Your wallet needs SOL to pay transaction fees:

```bash
solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet
```

Or use the [Solana Devnet Faucet](https://faucet.solana.com/).

### 4. Start development server

```bash
yarn dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

### 5. Build for production

```bash
yarn build
```

---

## 🧪 Testing the Escrow Flow

You need two SPL token mints on Devnet to test `Make Offer` and `Take Offer`. The following mints are available for testing:

| Token | Mint address | Decimals |
|-------|-------------|----------|
| Token A (USDC-Dev) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | 6 |
| Token B (BONK-Dev) | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` | 5 |

**Recommended test flow:**

1. Airdrop tokens to your wallet using the [SPL Token CLI](https://spl.solana.com/token) or request from a Devnet faucet.
2. Connect your wallet and go to **Make Offer** — select Token A, enter an amount, paste the Token B mint, and submit.
3. Switch to a second wallet (or ask someone to use your live deployment) and go to **Take Offer** — your offer should appear within seconds thanks to WebSocket refresh.
4. Click **Take Offer** to complete the swap.

---

## 🧑‍💻 Wallets Tested

- **Phantom** (Chrome extension) ✅
- **Backpack** (Chrome extension) ✅
- **Solflare** (Chrome extension) ✅

---

## 🔗 Devnet Transaction Examples

| Action | Transaction |
|--------|-------------|
| Make Offer | [5fuGGjb8j7Tzk...T8jnYu](https://explorer.solana.com/tx/5fuGGjb8j7TzkmiAfd2omjE3MXnHecYAfdGierTLj378j5UGBP5hEtW5CBZCh5p8kSySAWzoYG8m3L147zT8jnYu?cluster=devnet) |
| Take Offer | [4V9fiP44xa6g...fGqhse](https://explorer.solana.com/tx/4V9fiP44xa6gWMq8TvnAnrptrGbp31oLNYPdX21rZxhnb5SpLZLRqzEkYBJX88ufRobyNs9trVf9j1Ace6fGqhse?cluster=devnet) |

---

## 🌐 Live Deployment

👉 **[https://solana-startterm-app.vercel.app](https://solana-startterm-app.vercel.app)**

---

## 📖 Notes

- All transactions run strictly on **Solana Devnet** — no real funds are at risk.
- Run `yarn codegen` to regenerate TypeScript instructions and decoders if the IDL changes.
- Offer IDs are derived from `BigInt(Date.now())` to prevent PDA collisions between offers from the same wallet.
- The app retries automatically (up to 3 attempts) if a blockhash expires before confirmation — common on Devnet.