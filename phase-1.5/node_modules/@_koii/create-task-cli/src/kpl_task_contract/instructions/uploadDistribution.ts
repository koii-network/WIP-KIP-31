import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, blob, ns64, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { padStringWithSpaces } from "../util";

interface Data {
    instruction: number,
    instruction_data: Uint8Array
    round: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    blob(512, 'instruction_data'),
    ns64('round'),
]);

interface UploadDistributionParams {
    instruction_data: string,
    round: number,
    header: Uint8Array,
}

interface Accounts {
    taskState: PublicKey,
    dataAccount: PublicKey,
    programId: PublicKey
}

export async function uploadDistributionListInstruction(params: UploadDistributionParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.UploadDistributionListInstruction,
            instruction_data: Uint8Array.from([...params.header, ...new TextEncoder().encode(padStringWithSpaces(params.instruction_data, 508))]),
            round: params.round,
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.dataAccount, isSigner: true, isWritable: true},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}