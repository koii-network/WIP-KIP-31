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
    total_bounty_amount: number,
    bounty_amount_per_round: number,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: Uint8Array,
    task_locals: Uint8Array,
    allowed_failed_distributions: number,
    stake_pot_authority_seed: Uint8Array,
}

const DataLayout = struct<Data>([
    u8('instruction'),
    blob(24, 'task_name'),
    blob(64, 'task_description'),
    blob(64, 'task_audit_program'),
    blob(64, 'task_executable_network'),
    ns64('total_bounty_amount'),
    ns64('bounty_amount_per_round'),
    ns64('round_time'),
    ns64('audit_window'),
    ns64('submission_window'),
    ns64('minimum_stake_amount'),
    blob(64, 'task_metadata'),
    blob(64, 'task_locals'),
    ns64('allowed_failed_distributions'),
    blob(32, 'stake_pot_authority_seed'),
]);

interface CreateTaskParams {
    task_name: string,
    task_description: string,
    task_audit_program: string,
    task_executable_network: string,
    total_bounty_amount: number,
    bounty_amount_per_round: number,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: string,
    task_locals: string,
    allowed_failed_distributions: number, 
    mint_address: string,
    mint_digits:number
}

interface Accounts {
    payer: PublicKey,
    wallet: PublicKey,
    taskState: PublicKey,
    stakePot: PublicKey,
    programId: PublicKey
}

export async function createTaskInstruction(params: CreateTaskParams, accounts: Accounts): Promise<TransactionInstruction> {
    if (!params.mint_address) {
        console.warn('Mint key undefined. Check .env file and set MINT_KEY');
        process.exit();
    }
    console.log(accounts);
    const data = Buffer.alloc(DataLayout.span);
    let seed = sha256(accounts.stakePot.toBase58());
    let mint = new PublicKey(params.mint_address);
    let [authority_pda, _bump] = await PublicKey.findProgramAddressSync(
        [seed],
        accounts.programId,
    );

    let SYSVAR_PUB = new PublicKey("11111111111111111111111111111111");  
    // TODO: SPL Digit to correct digit [Not Always 10**9]

    const total_bounty_amount_in_roe = params.total_bounty_amount* (10 ** params.mint_digits);
    const bounty_amount_per_round_in_roe = params.bounty_amount_per_round* (10 ** params.mint_digits);

    const instructionData = {
        instruction: TaskInstruction.CreateTaskInstruction,
        task_name: new TextEncoder().encode(padStringWithSpaces(params.task_name, 24)),
        task_description: new TextEncoder().encode(padStringWithSpaces(params.task_description, 64)),
        task_audit_program: new TextEncoder().encode(padStringWithSpaces(params.task_audit_program, 64)), //must be 64 chracters long
        task_executable_network: new TextEncoder().encode(padStringWithSpaces(params.task_executable_network, 64)), //must be 64 chracters long
        total_bounty_amount: total_bounty_amount_in_roe,
        bounty_amount_per_round: bounty_amount_per_round_in_roe,
        round_time: params.round_time,
        audit_window: params.audit_window,
        submission_window: params.submission_window,
        minimum_stake_amount: params.minimum_stake_amount,
        task_metadata: new TextEncoder().encode(padStringWithSpaces(params.task_metadata, 64)),
        task_locals: new TextEncoder().encode(padStringWithSpaces(params.task_locals, 64)),
        allowed_failed_distributions: params.allowed_failed_distributions,
        stake_pot_authority_seed: seed, 
    };
    console.log("instructionData");
    console.log(instructionData);
    console.log("mint address using");
    console.log(mint);
    DataLayout.encode(instructionData, data);
    console.log(accounts.taskState.toBase58());
    const keys = [
        {pubkey: accounts.payer, isSigner: true, isWritable: true},
        {pubkey: accounts.wallet, isSigner: false, isWritable: true},
        {pubkey: accounts.taskState, isSigner: true, isWritable: true}, // task_state_info
        {pubkey: accounts.stakePot, isSigner: true, isWritable: true}, // stake pot
        {pubkey: authority_pda, isSigner: false, isWritable: true}, // stake pot authority
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