import { address, type Address, getProgramDerivedAddress, getAddressEncoder } from '@solana/kit';
import type { Base64EncodedBytes } from '@solana/rpc-types';
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

// ----- Helius DAS response types -----

interface HeliusTokenInfo {
    symbol?: string;
    decimals?: number;
    balance?: number;
    associated_token_address?: string;
}

interface HeliusAssetContent {
    metadata?: {
        name?: string;
        symbol?: string;
    };
    links?: {
        image?: string;
    };
}

interface HeliusAsset {
    id: string;
    token_info?: HeliusTokenInfo;
    content?: HeliusAssetContent;
}

// ----- helpers -----

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function parseHeliusAsset(asset: HeliusAsset): TokenMeta {
    const ti = asset.token_info ?? {};
    return {
        symbol: ti.symbol ?? asset.content?.metadata?.symbol ?? '',
        name: asset.content?.metadata?.name ?? ti.symbol ?? '',
        decimals: ti.decimals ?? 6,
        logo: asset.content?.links?.image,
    };
}

// ----- main fetch -----

export async function fetchAllOffers(): Promise<OfferAccount[]> {
    // Discriminator у base64 — валідатор фільтрує на своєму боці,
    // по мережі приходять лише Offer акаунти.
    const discriminatorBase64 = btoa(
        String.fromCharCode(...OFFER_DISCRIMINATOR)
    ) as Base64EncodedBytes;

    const response = await rpc.getProgramAccounts(
        address(ESCROW_PROGRAM_ADDRESS) as Address,
        {
            encoding: 'base64',
            filters: [
                {
                    memcmp: {
                        offset: 0n,
                        bytes: discriminatorBase64,
                        encoding: 'base64',
                    },
                },
            ],
        },
    ).send();

    const decoder = getOfferDecoder();

    // Локальна перевірка discriminator залишається як страховка
    const offers = (response as Array<{ pubkey: string; account: { data: [string, 'base64'] } }>)
        .flatMap((item) => {
            try {
                const dataBytes = base64ToUint8Array(item.account.data[0]);
                const offer = decoder.decode(dataBytes) as Offer;
                return [{ pubkey: item.pubkey, data: offer }];
            } catch {
                return [];
            }
        });

    if (offers.length === 0) return [];

    const TOKEN_PROGRAM_ID = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const ATOKEN_PROGRAM_ID = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const enrichedOffers = await Promise.all(
        offers.map(async (offer) => {
            try {
                const [vault] = await getProgramDerivedAddress({
                    programAddress: ATOKEN_PROGRAM_ID,
                    seeds: [
                        getAddressEncoder().encode(address(offer.pubkey)),
                        getAddressEncoder().encode(TOKEN_PROGRAM_ID),
                        getAddressEncoder().encode(address(offer.data.tokenMintA)),
                    ],
                });

                const balanceResp = await (
                    rpc.getTokenAccountBalance as (
                        address: Address,
                    ) => { send(): Promise<{ value: { uiAmount: number | null; amount: string } }> }
                )(vault).send();

                const tokenAAmountUi = balanceResp?.value?.uiAmount ?? 0;
                const tokenABalance = Number(balanceResp?.value?.amount ?? '0');

                return { ...offer, tokenAAmountUi, tokenABalance };
            } catch (e) {
                console.warn(`Failed to fetch vault balance for offer: ${offer.pubkey}`, e);
                return { ...offer, tokenAAmountUi: 0, tokenABalance: 0 };
            }
        }),
    );

    const mintsToFetch = new Set<string>();
    enrichedOffers.forEach((o) => {
        mintsToFetch.add(o.data.tokenMintA);
        mintsToFetch.add(o.data.tokenMintB);
    });

    const metadataMap = new Map<string, TokenMeta>();

    try {
        const batchMeta = await getAssetBatch(Array.from(mintsToFetch)) as HeliusAsset[];
        batchMeta.forEach((asset) => {
            if (!asset?.id) return;
            metadataMap.set(asset.id, parseHeliusAsset(asset));
        });
    } catch (e) {
        console.warn('Mints metadata fetch failed', e);
    }

    const fallback: TokenMeta = { symbol: '', name: '', decimals: 6 };

    return enrichedOffers.map((o) => ({
        ...o,
        tokenAMeta: metadataMap.get(o.data.tokenMintA) ?? fallback,
        tokenBMeta: metadataMap.get(o.data.tokenMintB) ?? fallback,
    }));
}