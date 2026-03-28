import { autoDiscover, createClient } from "@solana/client";

const endpoint: string = import.meta.env.VITE_RPC_URL ?? 'https://api.devnet.solana.com';
const websocketEndpoint: string = import.meta.env.VITE_WEBSOCKET_URL ?? endpoint.replace('https://', 'wss://').replace('http://', 'ws://');

export const solanaClient = createClient({
    endpoint,
    websocketEndpoint,
    walletConnectors: autoDiscover(),
});