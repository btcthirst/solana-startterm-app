/**
 * RPC and WebSockets Configuration
 * Provides low-level access to the Solana JSON-RPC API and real-time event subscriptions.
 */
import { createSolanaRpc, createSolanaRpcSubscriptions, devnet } from "@solana/kit";

const rpcUrl: string = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const wsUrl: string = import.meta.env.VITE_SOLANA_WS_URL ?? rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

/** 
 * Standard RPC client for interacting with the Solana blockchain.
 */
export const rpc = createSolanaRpc(devnet(rpcUrl));

/** 
 * WebSocket-based subscription client for real-time account and program notifications.
 */
export const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(wsUrl));
