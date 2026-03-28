import { ESCROW_PROGRAM_ADDRESS } from '../src/generated/programs/escrow';
import { rpcSubscriptions } from '../src/lib/rpc';
import { address } from '@solana/kit';

async function test() {
    console.log(typeof rpcSubscriptions.programNotifications);
}
test();
