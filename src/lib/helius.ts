const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY ?? '';
const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

export const HELIUS_RPC = HELIUS_API_KEY
    ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : RPC_URL;

/**
 * Represents a token account with both on-chain raw data 
 * and human-readable metadata.
 */
export interface TokenAccount {
    mint: string;
    symbol: string;
    name: string;
    logo?: string;
    /** The balance divided by the token's decimals (e.g., 1.5 SOL). */
    balance: number;
    /** The raw on-chain bigint value. */
    rawBalance: bigint;
    decimals: number;
    /** The Associated Token Account (ATA) address. */
    tokenAccount: string;
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

/**
 * Fetches all fungible token accounts for a given owner using the Helius DAS API.
 * 
 * @param ownerAddress - The Solana public key of the account to query.
 * @returns A promise resolving to an array of parsed TokenAccount objects.
 */
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

/**
 * Fetches metadata for a batch of token mints from Helius.
 * 
 * @param ids - Array of mint addresses to fetch.
 * @returns A promise resolving to an array of asset objects.
 */
export async function getAssetBatch(ids: string[]) {
    if (!ids.length) return [];
    try {
        const result = await heliusPost('getAssetBatch', { ids });
        return result || [];
    } catch (e) {
        console.warn('getAssetBatch failed:', e);
        return [];
    }
}