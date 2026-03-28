import { address, type Address } from '@solana/kit';
import { rpc } from './rpc';
import { OFFER_DISCRIMINATOR, getOfferDecoder, type Offer } from '../generated/accounts/offer';
import { ESCROW_PROGRAM_ADDRESS } from '../generated/programs/escrow';

export interface OfferAccount {
    pubkey: string;
    data: Offer;
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

    return items.flatMap((item) => {
        try {
            // Use atob instead of Buffer.from — works in browser without polyfill
            const dataBytes = base64ToUint8Array(item.account.data[0]);

            if (!discriminatorMatches(dataBytes)) return [];

            const offer = decoder.decode(dataBytes) as Offer;
            return [{ pubkey: item.pubkey, data: offer }];
        } catch {
            return [];
        }
    });
}