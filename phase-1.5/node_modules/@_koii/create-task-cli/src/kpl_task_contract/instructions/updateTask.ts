/* eslint-disable prefer-const */
import { PublicKey, TransactionInstruction, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { padStringWithSpaces } from "../util";
import { struct, u8, blob, ns64 } from '@solana/buffer-layout';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { TaskInstruction } from "./instruction";
import {sha256} from '@noble/hashes/sha256';

interface Data {
    instruction: number,
    task_name: Uint8Array,
    task_description: Uint8Array,
    task_audit_program: Uint8Array,
    task_executable_network: Uint8Array,
    bounty_amount_per_round: number,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: Uint8Array,
    task_locals: Uint8Array,
    allowed_failed_distributions: number,
    new_stake_pot_seed: Uint8Array,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    blob(24, 'task_name'),
    blob(64, 'task_description'),
    blob(64, 'task_audit_program'),
    blob(64, 'task_executable_network'),
    ns64('bounty_amount_per_round'),
    ns64('round_time'),
    ns64('audit_window'),
    ns64('submission_window'),
    ns64('minimum_stake_amount'),
    blob(64, 'task_metadata'),
    blob(64, 'task_locals'),
    ns64('allowed_failed_distributions'),
    blob(32, 'new_stake_pot_seed'),
]);

interface UpdateTaskParams {
    task_name: string,
    task_description: string,
    task_audit_program: string,
    task_executable_network: string,
    bounty_amount_per_round: number,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: string,
    task_locals: string,
    allowed_failed_distributions: number,
    mint_address: string,
    mint_digits: number,
}

interface Accounts {
    payer: PublicKey,
    taskState: PublicKey,
    newTaskState: PublicKey,
    stakePot: PublicKey,
    newStakePot: PublicKey,
    // stakePotAuthority: PublicKey,
    programId: PublicKey
}

export async function updateTaskInstruction(params: UpdateTaskParams, accounts: Accounts): Promise<TransactionInstruction> {
    const mint_address = params.mint_address;
    const data = Buffer.alloc(DataLayout.span);
    let seed = sha256(accounts.stakePot.toBase58());

    let mint = new PublicKey(mint_address);
    let [stakePotAuthority, _bump] = await PublicKey.findProgramAddressSync(
        [seed],
        accounts.programId,
    );

    seed = sha256(accounts.newStakePot.toBase58());
    let [new_authority_pda, _] = await PublicKey.findProgramAddressSync(
        [seed],
        accounts.programId,
    );
    
    let SYSVAR_PUB = new PublicKey("11111111111111111111111111111111");
    
    DataLayout.encode(
        {
            instruction: TaskInstruction.UpdateTaskInstruction,
            task_name: new TextEncoder().encode(padStringWithSpaces(params.task_name, 24)),
            task_description: new TextEncoder().encode(padStringWithSpaces(params.task_description, 64)),
            task_audit_program: new TextEncoder().encode(padStringWithSpaces(params.task_audit_program, 64)), //must be 64 chracters long
            task_executable_network: new TextEncoder().encode(padStringWithSpaces(params.task_executable_network, 64)), //must be 64 chracters long
            bounty_amount_per_round: params.bounty_amount_per_round * (10**params.mint_digits),
            round_time: params.round_time,
            audit_window: params.audit_window,
            submission_window: params.submission_window,
            minimum_stake_amount: params.minimum_stake_amount,
            task_metadata: new TextEncoder().encode(padStringWithSpaces(params.task_metadata, 64)),
            task_locals: new TextEncoder().encode(padStringWithSpaces(params.task_locals, 64)),
            allowed_failed_distributions: params.allowed_failed_distributions,
            new_stake_pot_seed: seed, 
        },
        data
    );


    const keys = [
        {pubkey: accounts.payer, isSigner: true, isWritable: true},
        {pubkey: accounts.taskState, isSigner: false, isWritable: true},
        {pubkey: accounts.stakePot, isSigner: false, isWritable: true},
        {pubkey: stakePotAuthority, isSigner: false, isWritable: true},
        {pubkey: accounts.newTaskState, isSigner: true, isWritable: true},
        {pubkey: accounts.newStakePot, isSigner: true, isWritable: true},
        {pubkey: new_authority_pda, isSigner: false, isWritable: true},
        {pubkey: mint, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
        {pubkey: SYSVAR_PUB, isSigner: false, isWritable: false},
        {pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
    ];

    return new TransactionInstruction({
        keys,
        programId: accounts.programId,
        data,
    });
}