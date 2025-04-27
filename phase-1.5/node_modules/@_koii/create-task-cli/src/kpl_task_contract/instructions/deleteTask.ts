import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import {sha256} from '@noble/hashes/sha256';

interface Data {
    instruction: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
]);

interface Accounts {
    taskState: PublicKey,
    taskManager: PublicKey,
    stakePot: PublicKey,
    programId: PublicKey,
    mint_address: string
}

export async function deleteTaskInstruction(accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    let mint = await new PublicKey(accounts.mint_address || "");
    DataLayout.encode(
        {
            instruction: TaskInstruction.DeleteTaskInstruction,
        },
        data
    );

    let seed = sha256(accounts.stakePot.toBase58());
    let [stakePotAuth, _bump] = await PublicKey.findProgramAddressSync(
        [seed],
        accounts.programId,
    );

    let [managerAccountDataHolder, _] = await PublicKey.findProgramAddressSync(
        [Buffer.from("manager")],
        accounts.programId,
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.taskManager, isSigner: true, isWritable: true},
        {pubkey: accounts.stakePot, isSigner: false, isWritable: true},
        {pubkey: stakePotAuth, isSigner: false, isWritable: false},
        {pubkey: managerAccountDataHolder, isSigner: false, isWritable: true},
        {pubkey: mint, isSigner: false, isWritable: true},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}