# Solana SPL Token Escrow Frontend

A modern, fully functional Web3 frontend for the SPL-token escrow program on Solana Devnet. Built specifically for the Superteam Ukraine Solana Startup Terminal program.

> **Program Address:** `4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy`

## 🌟 Features

- **Make Offer** — Lock `Token A` in a vault and specify the exact amount of `Token B` you want in return.
- **Take Offer** — Browse all open offers in real-time. Instantly accept one, completing the atomic swap securely on-chain.
- **Dynamic Vault Parsing** — Fully derives the state of the ATA vaults natively to display exact balances of `Token A`.
- **Helius Asset Integration** — Renders raw mint addresses into human-readable symbols, names, decimals, and logos.
- **Custom Wallet Modal** — Specifically designed from scratch. Automatically detects and connects Wallet Standard compatible wallets like Phantom, Backpack, and Solflare without relying on heavy third-party UI libraries like `@solana/wallet-adapter-react-ui`.
- **Premium Glassmorphism UX** — Polished, responsive, dynamic interface featuring loading skeletons, hover animations, and comprehensive error handling. 

## 🏗️ Tech Stack

| Layer | Technology |
|-------|---------|
| **Core** | Vite + React 19 + TypeScript |
| **Solana Client** | `@solana/kit` (Anza kit) — **No `@solana/web3.js` used** |
| **Wallet Connection** | `@solana/react-hooks` |
| **Transaction Decoding**| Codama (`codama`, `@codama/nodes-from-anchor`, `@codama/renderers-js`) |
| **Styling** | Tailwind CSS v4 + Custom Tailwind utilities |

---

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd solana-startterm-app
yarn install
```

### 2. Configure Environment

```bash
cp .env.example .env
```
Edit `.env` and add your **Helius API key** (free tier works perfectly). The string should look like:
```env
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_HELIUS_API_KEY=your_api_key_here
```

### 3. Start Development Server

```bash
yarn dev
```
Open **[http://localhost:5173](http://localhost:5173)** to view the app in action. 

### 4. Build for Production

```bash
yarn build
```

---

## 🧑‍💻 Wallets Tested

- **Phantom** (Chrome extension) ✅
- **Backpack** (Chrome extension) ✅
- **Solflare** (Chrome extension) ✅

---

## 🔗 Submission Requirements

*(For the developer submitting this assignment: Fill in the placeholders below before pushing)*

### Live Deployment
👉 **Live Demo:** [https://solana-startterm-app.vercel.app](https://solana-startterm-app.vercel.app)

### Devnet Transaction Examples
👉 **Make Offer TX:** [`https://explorer.solana.com/tx/5fuGGjb8j7TzkmiAfd2omjE3MXnHecYAfdGierTLj378j5UGBP5hEtW5CBZCh5p8kSySAWzoYG8m3L147zT8jnYu?cluster=devnet`](https://explorer.solana.com/)
👉 **Take Offer TX:** [`https://explorer.solana.com/tx/4V9fiP44xa6gWMq8TvnAnrptrGbp31oLNYPdX21rZxhnb5SpLZLRqzEkYBJX88ufRobyNs9trVf9j1Ace6fGqhse?cluster=devnet`](https://explorer.solana.com/)

---

## 📖 Notes

- All transactions are strictly confined to **Solana Devnet**.
- Use `yarn codegen` anytime you need to re-generate the TypeScript instructions and decoders if the IDL changes.
- Escrow Offer IDs are randomly derived using `BigInt(Date.now())` internally to prevent state collisions.