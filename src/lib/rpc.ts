import { createSolanaRpc, createSolanaRpcSubscriptions, devnet } from "@solana/kit";

const rpcUrl: string = import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
const wsUrl: string = import.meta.env.VITE_SOLANA_WS_URL ?? rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');

export const rpc = createSolanaRpc(devnet(rpcUrl));
export const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(wsUrl));
