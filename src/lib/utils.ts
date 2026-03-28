import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function shortenAddress(addr: string, chars = 4): string {
    return `${addr.slice(0, chars)}…${addr.slice(-chars)}`;
}