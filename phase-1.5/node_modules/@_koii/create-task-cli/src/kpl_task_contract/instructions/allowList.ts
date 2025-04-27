import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";

interface Data {
    instruction: number,
    is_allowlisted: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    u8('is_allowlisted'),
]);

interface AllowListParams {
    is_allowlisted: number,
}

interface Accounts {
    manager: PublicKey,
    taskState: PublicKey,
    programId: PublicKey
}

export async function allowListInstruction(params: AllowListParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.AllowListInstruction,
            is_allowlisted: params.is_allowlisted,
        },
        data
    );

    let [managerAccountDataHolder, _bump] = await PublicKey.findProgramAddress(
        [Buffer.from("manager")],
        accounts.programId,
    );

    console.log("managerAccountDataHolder: ", managerAccountDataHolder.toBase58());

    const keys = [
        {pubkey: accounts.manager, isSigner: true, isWritable: false},
        {pubkey: managerAccountDataHolder, isSigner: false, isWritable: true},
        {pubkey: accounts.taskState, isSigner: true, isWritable: true},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}