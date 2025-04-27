import { PublicKey, SYSVAR_CLOCK_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { struct, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";

interface Data {
    instruction: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
]);

interface Accounts {
    taskState: PublicKey,
    submitter: PublicKey,
    programId: PublicKey
}

export async function withdrawInstruction(accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.WithdrawInstruction,
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.submitter, isSigner: true, isWritable: true},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}