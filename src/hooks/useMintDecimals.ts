import { useState, useEffect } from 'react';
import { address, type Address } from '@solana/kit';
import { rpc } from '../lib/rpc';

/**
 * Describes the result of a mint decimals lookup.
 */
export interface MintInfo {
    decimals: number;
    /** True while the RPC call is in flight. */
    loading: boolean;
    /** Human-readable error message, or null if no error. */
    error: string | null;
}

const IDLE: MintInfo = { decimals: 0, loading: false, error: null };

/**
 * SPL Mint account layout (fixed-size, 82 bytes).
 * Offset 44 is the `decimals` u8 field.
 *   0..36  mint_authority (COption<Pubkey>)
 *  36..40  supply (u64) — low 4 bytes (big-picture)
 *  40..44  supply continued
 *  44      decimals (u8)  ← we read this
 *  45      is_initialized (bool)
 *  ...
 */
const MINT_DECIMALS_OFFSET = 44;
const MINT_ACCOUNT_SIZE = 82;

/**
 * Returns the decimals of an SPL token mint by reading the raw on-chain
 * account data. Handles Token-2022 mints too — both share the same
 * leading 82-byte layout.
 *
 * Returns IDLE when `mintAddress` is null/empty/too-short.
 * Debounces the RPC call by 400 ms so the user can finish typing.
 */
export function useMintDecimals(mintAddress: string | null): MintInfo {
    const [info, setInfo] = useState<MintInfo>(IDLE);

    useEffect(() => {
        const trimmed = mintAddress?.trim() ?? '';

        // Need at least 32 chars for a valid base58 pubkey
        if (trimmed.length < 32) {
            setInfo(IDLE);
            return;
        }

        let cancelled = false;

        const timer = setTimeout(async () => {
            setInfo({ decimals: 0, loading: true, error: null });

            try {
                const addr = address(trimmed as `${string}`);
                const result = await rpc
                    .getAccountInfo(addr as Address, { encoding: 'base64' })
                    .send();

                if (cancelled) return;

                const accountData = result.value;

                if (!accountData) {
                    setInfo({ decimals: 0, loading: false, error: 'Mint account not found on devnet.' });
                    return;
                }

                // Decode base64 → Uint8Array
                const [b64, _encoding] = accountData.data as [string, string];
                const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

                if (raw.length < MINT_ACCOUNT_SIZE) {
                    setInfo({ decimals: 0, loading: false, error: 'Account is not a valid SPL mint.' });
                    return;
                }

                const decimals = raw[MINT_DECIMALS_OFFSET];
                setInfo({ decimals, loading: false, error: null });
            } catch (err) {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : 'Failed to fetch mint info.';
                setInfo({ decimals: 0, loading: false, error: msg.slice(0, 100) });
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [mintAddress]);

    return info;
}