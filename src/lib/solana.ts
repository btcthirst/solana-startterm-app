/**
 * Solana Client Configuration
 * This file provides a unified interface for connecting to the Solana blockchain,
 * including support for automatic wallet discovery.
 */

import { autoDiscover, createClient } from "@solana/client";

const endpoint: string = import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com';
const websocketEndpoint: string = import.meta.env.VITE_WEBSOCKET_URL ?? endpoint.replace('https://', 'wss://').replace('http://', 'ws://');

/** 
 * Pre-configured Solana client with wallet discovery enabled.
 * Used globally to interact with the blockchain and manage wallet connections.
 */
export const solanaClient = createClient({
    endpoint,
    websocketEndpoint,
    walletConnectors: autoDiscover(),
});