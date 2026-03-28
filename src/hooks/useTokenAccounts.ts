import { useState, useEffect } from 'react';
import { getTokenAccounts, type TokenAccount } from '../lib/helius';

export function useTokenAccounts(ownerAddress: string | null) {
    const [tokens, setTokens] = useState<TokenAccount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ownerAddress) { setTokens([]); return; }
        let cancelled = false;
        setLoading(true);
        getTokenAccounts(ownerAddress)
            .then((r: TokenAccount[]) => { if (!cancelled) setTokens(r); })
            .catch((e: Error) => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [ownerAddress]);

    return { tokens, loading, error };
}