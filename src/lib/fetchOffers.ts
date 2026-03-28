import { address, getBase58Codec, type Address } from '@solana/kit';
import { rpc } from './rpc';
import { OFFER_DISCRIMINATOR, getOfferDecoder, type Offer } from '../generated/accounts/offer';
import { ESCROW_PROGRAM_ADDRESS } from '../generated/programs/escrow';

export interface OfferAccount { pubkey: string; data: Offer; }

export async function fetchAllOffers(): Promise<OfferAccount[]> {
    // OFFER_DISCRIMINATOR = [215, 88, 60, 71, 170, 162, 73, 229]
    // Перетворюємо в base58 для memcmp фільтра
    const discriminatorB58 = getBase58Codec().decode(OFFER_DISCRIMINATOR) as unknown as `${string}`;

    const response = await (rpc.getProgramAccounts as any)(
        address(ESCROW_PROGRAM_ADDRESS) as Address,
        {
            encoding: 'base64',
            filters: [{
                memcmp: { offset: 0n, bytes: discriminatorB58, encoding: 'base58' },
            }],
        },
    ).send();

    const decoder = getOfferDecoder();

    return (response as any[]).flatMap((item: any) => {
        try {
            const dataBytes = Buffer.from(item.account.data[0], 'base64');
            const offer = decoder.decode(new Uint8Array(dataBytes));
            return [{ pubkey: item.pubkey, data: offer }];
        } catch { return []; }
    });
}