import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, ns64, u8, blob } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { padStringWithSpaces } from "../util";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"

interface Data {
    instruction: number,
    stake_amount: number,
    ip_address: Uint8Array
}

const DataLayout = struct<Data>([
    u8('instruction'),
    ns64('stake_amount'),
    blob(64, 'ip_address'),
]);

interface StakeParams {
    stake_amount: number,
    ip_address: string,
}

interface Accounts {
    taskState: PublicKey,
    submitterSplAccount: PublicKey,
    submitter: PublicKey,
    stakePot: PublicKey,
    programId: PublicKey
}


export async function stakeInstruction(params: StakeParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.StakeInstruction,
            stake_amount: params.stake_amount,
            ip_address: new TextEncoder().encode(padStringWithSpaces(params.ip_address, 64)),
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.submitter, isSigner: true, isWritable: true},
        {pubkey: accounts.submitterSplAccount, isSigner: false, isWritable: true},
        {pubkey: accounts.stakePot, isSigner: false, isWritable: true},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}