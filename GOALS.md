About Superteam Ukraine
We're part of Superteam, a global community of Solana builders. We help onboard new talent, run bounties, and support the Solana ecosystem in Ukraine. We're all about fostering growth and innovation in the Web3 space.
Mission
Develop a React frontend for an SPL-token escrow program on Solana Devnet.
Who can participate
This bounty is exclusively for Solana Startup Terminal students – Dev Track.
What to do
To participate, you must be an active student of the Solana Startup Terminal course.
* Step 1 — Mandatory: Attend the Live Lecture: ⚠️ Thursday, March 26th, 19:00 (Kyiv time) via Google Meet.
* Step 2 — Complete the following Technical Task:
Scope Detail
This bounty is a practical task to enhance your Solana development skills. You'll be building a functional React frontend for a deployed SPL-token escrow program on Solana Devnet.
* Network: Solana Devnet
* Program Address: 4g5EN9Sk7wEcZqfjdjDtvq7T9u5YUrBKTe23fVJoL8yy
* IDL: gist.github.com
What to Build: A minimal yet fully functional escrow interface that allows users to:
* Make Offer: Lock Token A in a vault and specify the desired amount of Token B in return.
* Take Offer: View open offers and accept one, completing the swap.
* Both make_offer and take_offer instructions must operate fully via real Devnet transactions.
Technical Requirements:
* Bundler: Vite + React + TypeScript
* Solana Client: @solana/kit (Anza kit) – no @solana/web3.js
* Styling: Tailwind CSS + shadcn-style components (recommended)
Feature Checklist:
* Wallet Connection:
   * Custom wallet connection modal – no third-party UI libraries.
   * The modal should display all automatically detected wallet connectors (Phantom, Backpack, Solflare, etc.).
   * Show wallet icon, name, and abbreviated connected address after connection.
   * Disconnect button.
* Make Offer:
   * Input for selecting Token A from the connected wallet's token accounts.
   * Input for the amount of Token A to offer.
   * Input for selecting Token B (by mint address) and the desired amount.
   * When submitting: construct and send the make_offer instruction via @solana/kit.
* Take Offer:
   * Fetch and display all open Offer accounts created through your frontend. ⭐ (Starred task for extra credit)
   * Each offer card should show: maker address, Token A mint, Token B mint, offered amount, and required amount.
   * "Take" button: construct and send the take_offer instruction.
   * Display a transaction signature with a link to Solana Explorer after successful execution.
* Overall UX:
   * Loading states during all asynchronous operations.
   * Error messages for: user rejection, insufficient balance, stale blockhash.
   * All transaction links should open to https://explorer.solana.com/tx/[sig]?cluster=devnet.
Submission Requirements
To participate, you must be an active student of the Solana Startup Terminal course.
* Step 1 — Mandatory: Attend the Live Lecture:
   * Thursday, March 26th, 19:00 (Kyiv time) via Google Meet.
   * Attendance is mandatory. Submissions without lecture participation will not be considered.
   * You must provide the email address used for the live lecture in your submission.
* Step 2 — Complete the Technical Task: Upon submission, provide the following in the application form:
   * Lecture Email: The email address you used to register for the live lecture on March 26th.
   * Public GitHub Repository: Include your code with a README.md file. The README.md should contain setup instructions and a note on which wallets were tested.
   * Live Deployment Link: A public URL (Vercel, Netlify, GitHub Pages, or similar). It must be functional without local setup.
   * At least one successful Devnet transaction: Include a link to the Solana Explorer for either a make_offer or take_offer transaction in your README.md.
* Step 3 – Write a tweet on X about your submission or Solana Startup Terminal participation and tag https://x.com/SuperteamUKR
Judging Criteria
* Transactions work on Devnet (make + take): 35%
* Custom wallet modal (no third-party UI): 15%
* Available live deployment: 15%
* Code quality and TypeScript correctness: 15%
* UI/UX (clarity, error handling, loading states): 20%
* Applications using @solana/web3.js instead of @solana/kit or a third-party wallet modal will not be accepted.