import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple Classnames or Tailwind classes with proper merging.
 *
 * @param inputs - List of class names or values to merge.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Truncates a Solana address for display purposes.
 * 
 * @param addr - The full Solana public key (base58).
 * @param chars - Number of characters to keep at the start and end (default: 4).
 * @returns A truncated address string (e.g., "ABCD…WXYZ").
 */
export function shortenAddress(addr: string, chars = 4): string {
    return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}