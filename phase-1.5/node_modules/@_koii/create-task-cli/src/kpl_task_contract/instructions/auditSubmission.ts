import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { struct, ns64, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";

interface Data {
    instruction: number,
    is_valid: number
    round: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    u8('is_valid'),
    ns64('round'),
]);

interface AuditSubmissionParams {
    is_valid: number,
    round: number,
}

interface Accounts {
    taskState: PublicKey,
    voter: PublicKey,
    candidate: PublicKey,
    programId: PublicKey
}

export async function auditSubmissionsInstruction(params: AuditSubmissionParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.AuditSubmissionsInstruction,
            is_valid: params.is_valid,
            round: params.round,
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.voter, isSigner: true, isWritable: true},
        {pubkey: accounts.candidate, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}