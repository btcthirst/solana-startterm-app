import { address, type Address, getProgramDerivedAddress, getAddressEncoder } from '@solana/kit';
import { rpc } from './rpc';
import { OFFER_DISCRIMINATOR, getOfferDecoder, type Offer } from '../generated/accounts/offer';
import { ESCROW_PROGRAM_ADDRESS } from '../generated/programs/escrow';
import { getAssetBatch } from './helius';

export interface TokenMeta {
    symbol: string;
    name: string;
    decimals: number;
    logo?: string;
}

export interface OfferAccount {
    pubkey: string;
    data: Offer;
    tokenABalance?: number;
    tokenAAmountUi?: number;
    tokenAMeta?: TokenMeta;
    tokenBMeta?: TokenMeta;
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function discriminatorMatches(data: Uint8Array): boolean {
    if (data.length < 8) return false;
    for (let i = 0; i < 8; i++) {
        if (data[i] !== OFFER_DISCRIMINATOR[i]) return false;
    }
    return true;
}

export async function fetchAllOffers(): Promise<OfferAccount[]> {
    // 1. Fetch raw offer accounts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (rpc.getProgramAccounts as any)(
        address(ESCROW_PROGRAM_ADDRESS) as Address,
        { encoding: 'base64' },
    ).send();

    const items = response as Array<{
        pubkey: string;
        account: { data: [string, string] };
    }>;

    const decoder = getOfferDecoder();
    
    // Parse valid offers
    const offers = items.flatMap((item) => {
        try {
            const dataBytes = base64ToUint8Array(item.account.data[0]);
            if (!discriminatorMatches(dataBytes)) return [];
            const offer = decoder.decode(dataBytes) as Offer;
            return [{ pubkey: item.pubkey, data: offer }];
        } catch {
            return [];
        }
    });

    if (offers.length === 0) return [];

    // 2. Fetch Vault balances
    const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const ATOKEN_PROGRAM_ID = address("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

    // Fetch in parallel for speed
    const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        try {
            const [vault] = await getProgramDerivedAddress({
                programAddress: ATOKEN_PROGRAM_ID,
                seeds: [
                    getAddressEncoder().encode(address(offer.pubkey)),
                    getAddressEncoder().encode(TOKEN_PROGRAM_ID),
                    getAddressEncoder().encode(address(offer.data.tokenMintA)),
                ],
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const balanceResp = await (rpc.getTokenAccountBalance as any)(vault).send();
            const tokenAAmountUi = balanceResp?.value?.uiAmount ?? 0;
            const tokenABalance = balanceResp?.value?.amount ?? "0";

            return {
                ...offer,
                tokenAAmountUi,
                tokenABalance: Number(tokenABalance)
            };
        } catch (e) {
            console.warn(`Failed to fetch vault balance for offer: ${offer.pubkey}`, e);
            return {
                ...offer,
                tokenAAmountUi: 0,
                tokenABalance: 0
            };
        }
    }));

    // 3. Fetch Token Metadata (Batch)
    // Gather all unique mints
    const mintsToFetch = new Set<string>();
    enrichedOffers.forEach(o => {
        mintsToFetch.add(o.data.tokenMintA);
        mintsToFetch.add(o.data.tokenMintB);
    });

    const mintsArr = Array.from(mintsToFetch);
    const metadataMap = new Map<string, TokenMeta>();

    try {
        const batchMeta = await getAssetBatch(mintsArr);
        batchMeta.forEach((asset: any) => {
            if (!asset || !asset.id) return;
            const ti = asset.token_info || {};
            metadataMap.set(asset.id, {
                symbol: ti.symbol || asset.content?.metadata?.symbol || '',
                name: asset.content?.metadata?.name || ti.symbol || '',
                decimals: ti.decimals ?? 6,
                logo: asset.content?.links?.image
            });
        });
    } catch (e) {
        console.warn("Mints metadata fetch failed", e);
    }

    // Assign metadata to offers
    return enrichedOffers.map(o => ({
        ...o,
        tokenAMeta: metadataMap.get(o.data.tokenMintA) ?? { symbol: '', name: '', decimals: 6 },
        tokenBMeta: metadataMap.get(o.data.tokenMintB) ?? { symbol: '', name: '', decimals: 6 },
    }));
}
