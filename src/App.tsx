import { useState } from 'react';
import { WalletButton } from './components/WalletButton';
import { MakeOffer } from './components/MakeOffer';
import { TakeOffer } from './components/TakeOffer';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

type Tab = 'make' | 'take';

export default function App() {
  const [tab, setTab] = useState<Tab>('make');
  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] text-slate-100 selection:bg-indigo-500/30">
      <header className="border-b border-white/5 sticky top-0 z-40 bg-slate-950/50 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Escrow · Devnet
          </h1>
          <WalletButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12 relative">
        {/* Ambient glow behind main area */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#818cf8] to-[#c084fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"}}></div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 rounded-2xl bg-slate-900/50 p-1.5 mb-8 border border-white/5 backdrop-blur-md shadow-xl w-fit mx-auto">
          <button 
             onClick={() => setTab('make')}
             className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${tab === 'make' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
             Make Offer
          </button>
          <button 
             onClick={() => setTab('take')}
             className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${tab === 'take' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
             Take Offer
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlobalErrorBoundary>
            {tab === 'make' ? <MakeOffer /> : <TakeOffer />}
          </GlobalErrorBoundary>
        </div>
      </main>
    </div>
  );
}