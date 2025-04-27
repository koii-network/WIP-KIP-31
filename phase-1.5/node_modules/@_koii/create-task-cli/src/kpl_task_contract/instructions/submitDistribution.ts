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

interface SubmitDistributionParams {
    round: number,
}

interface Accounts {
    taskState: PublicKey,
    submitter: PublicKey,
    dataAccount: PublicKey,
    programId: PublicKey
}

export async function submitDistributionListInstruction(params: SubmitDistributionParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.SubmitDistributionListInstruction,
            round: params.round,
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.submitter, isSigner: true, isWritable: true},
        {pubkey: accounts.dataAccount, isSigner: true, isWritable: true},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}