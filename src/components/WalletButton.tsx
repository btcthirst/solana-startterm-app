import { useWalletConnection } from '@solana/react-hooks';
import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { WalletModal } from './ui/walletModal';
import { ConnectedMenu } from './ui/conectedMenu';

export function WalletButton() {
    const { connected, wallet, disconnect } = useWalletConnection();
    const [showModal, setShowModal] = useState(false);

    if (connected && wallet) {
        return (
            <ConnectedMenu
                address={String(wallet.account.address)}
                walletIcon={wallet.connector?.icon}
                walletName={wallet.connector?.name}
                onDisconnect={disconnect}
            />
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={cn(
                    'flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600/10',
                    'px-4 py-2 text-sm font-medium text-blue-400 transition-colors',
                    'hover:bg-blue-600/20 hover:text-blue-300',
                )}
            >
                <Wallet className="h-4 w-4" />
                Connect wallet
            </button>

            {showModal && <WalletModal onClose={() => setShowModal(false)} />}
        </>
    );
}