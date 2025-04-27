import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { struct, ns64, u8, blob } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { padStringWithSpaces } from "../util";

interface Data {
    instruction: number,
    submission: Uint8Array
    round: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    blob(512, 'submission'),
    ns64('round'),
]);

interface TaskSubmissionParams {
    submission: string,
    round: number,
}

interface Accounts {
    taskState: PublicKey,
    submitter: PublicKey,
    programId: PublicKey
}

export async function submitTaskInstruction(params: TaskSubmissionParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.SubmitTaskInstruction,
            submission: new TextEncoder().encode(padStringWithSpaces(params.submission, 512)),
            round: params.round,
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