import { useState } from 'react';
import { WalletButton } from './components/WalletButton';
import { MakeOffer } from './components/MakeOffer';
import { TakeOffer } from './components/TakeOffer';

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