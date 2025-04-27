import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { struct, ns64, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";

interface Data {
    instruction: number,
    round: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    ns64('round'),
]);

interface PayoutParams {
    round: number,
}

interface Accounts {
    taskState: PublicKey,
    dataAccount: PublicKey,
    programId: PublicKey
}

export async function payoutInstruction(params: PayoutParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.PayoutInstruction,
            round: params.round,
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
        {pubkey: accounts.dataAccount, isSigner: false, isWritable: true},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}