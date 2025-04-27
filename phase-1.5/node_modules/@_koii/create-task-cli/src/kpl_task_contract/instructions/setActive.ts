import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";

interface Data {
    instruction: number,
    is_active: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    u8('is_active'),
]);

interface SetActiveParams {
    is_active: number,
}

interface Accounts {
    taskState: PublicKey,
    ownerOrManager: PublicKey,
    programId: PublicKey
}

export async function setActiveInstruction(params: SetActiveParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.SetActiveInstruction,
            is_active: params.is_active,
        },
        data
    );

    let [managerAccountDataHolder, _bump] = await PublicKey.findProgramAddress(
        [Buffer.from("manager")],
        accounts.programId,
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.ownerOrManager, isSigner: true, isWritable: true},
        {pubkey: managerAccountDataHolder, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}