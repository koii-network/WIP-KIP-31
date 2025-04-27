/* eslint-disable prefer-const */
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { struct, ns64, u8 } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface Data {
    instruction: number,
    amount: number,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    ns64('amount'),
]);

interface FundTaskParams {
    amount: number,
    mint_address: string,
    mint_digits: number
}

interface Accounts {
    taskState: PublicKey,
    submitter: PublicKey,
    stakePot: PublicKey,
    programId: PublicKey
}

export async function fundTaskInstruction(params: FundTaskParams, accounts: Accounts): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    let mintKey = new PublicKey(params.mint_address|| "");

    let submitterSplAddress = await PublicKey.findProgramAddressSync(
        [
            accounts.submitter.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            mintKey.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];


    DataLayout.encode(
        {
            instruction: TaskInstruction.FundTaskInstruction,
            amount: params.amount*(10**params.mint_digits),
        },
        data
    );

    const keys = [
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.submitter, isSigner: true, isWritable: true},
        {pubkey: submitterSplAddress, isSigner: false, isWritable: true},
        {pubkey: accounts.stakePot, isSigner: false, isWritable: true},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}