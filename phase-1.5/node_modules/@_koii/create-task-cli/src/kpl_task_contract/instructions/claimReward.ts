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
    stakePot: PublicKey,
    claimer: PublicKey,
    beneficiary: PublicKey,
    programId: PublicKey
}

export async function claimRewardInstruction(accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.ClaimRewardInstruction,
        },
        data
    );

    let seed = sha256(accounts.stakePot.toBase58());
    let [authority_pda, _bump] = await PublicKey.findProgramAddressSync(
        [seed],
        accounts.programId,
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.claimer, isSigner: true, isWritable: true},
        {pubkey: accounts.stakePot, isSigner: false, isWritable: true},
        {pubkey: accounts.beneficiary, isSigner: false, isWritable: true},
        {pubkey: authority_pda, isSigner: false, isWritable: false},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}