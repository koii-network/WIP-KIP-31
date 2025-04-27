/* eslint-disable prefer-const */
/** 
 * File Structure:
 * This file's checkprogram(), establishConnection(), estabilishPayer() part comes from the k2-task-program-bpf repo. 
 * The other functions, like createTask() takes the input from the task_contract.ts file and the main part takes from the k2-task-program-bpf repo. 
 */
import {
    getRpcUrl,
    getPayer,
    createKeypairFromFile,
    padStringWithSpaces,
} from "./util";
import {
    Keypair,
    Connection,
    PublicKey,
} from '@solana/web3.js';
import { getKPLDigits } from "./util";
import fs from 'mz/fs';
import path from 'path'
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { createTaskInstruction, fundTaskInstruction, updateTaskInstruction, claimRewardInstruction, setActiveInstruction, withdrawInstruction } from "./instructions";
import { SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import dotenv from 'dotenv';
import { CreateAccountParams } from "@_koii/web3.js";
import { get } from "http";
dotenv.config();
/**
 * Connection to the network
 */
let connection: Connection;

export async function establishConnection(): Promise<Connection> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('KPL Program connection to cluster established:', rpcUrl, version);
    return connection;
}

// Keypair associated to the fees' payer
let payer: Keypair;
/**
 * Establish an account to pay for everything
 */
export async function establishPayer(payperson:Keypair) {
    payer = payperson;
}
/**
 * k2-task-program-bpf's program id
 */
let programId: PublicKey;

/**
 * Check if the k2-task-program-bpf program has been deployed
 */
export async function checkProgram(): Promise<PublicKey> {
    // Read program id from keypair file
    try {
        programId = new PublicKey("9Sn8j5ZRtGqUM14WQG9KLf5QBgrSCnJL3pWEKrVrLy54");
      } catch (err) {
        const errMsg = (err as Error).message;
        throw new Error(
          `Failed to read program keypair at due to error: ${errMsg}. The task executable need to be uploaded. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``
        );
      }
    

    // Check if the program has been deployed
    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo === null) {
        throw new Error("Please use koii testnet or mainnet to deploy the program");
    } else if (!programInfo.executable) {
        throw new Error(`Program is not executable`);
    }
    console.log(`KPL Using program ${programId.toBase58()}`);
    return programId;
}
function getStakePotAccount(): Keypair {
    let pubkey;
    let keypair;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        keypair = new Keypair();
        let pubkeyString = keypair.publicKey.toBase58();
        pubkeyString = pubkeyString.replace(
          pubkeyString.substring(0, 15),
          "stakepotaccount"
        );
        pubkey = new PublicKey(pubkeyString);
        if (PublicKey.isOnCurve(pubkey.toBytes())) {
          break;
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    return keypair;
  }
export async function createTask(
    payerWallet: Keypair,
    task_name: string,
    task_audit_program: string,
    total_bounty_amount: number,
    bounty_amount_per_round: number,
    space: number,
    task_description: string,
    task_executable_network: string,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: string,
    local_vars: string,
    koii_vars: string,
    allowed_failed_distributions: number,
    mint_address: string
  ): Promise<any> {
    /** Data Processing */
    const mint_digits = await getKPLDigits(mint_address, connection);
    const createTaskData = {
        task_name: task_name,
        task_description: task_description,
        task_audit_program: task_audit_program, //must be 64 chracters long
        task_executable_network: task_executable_network, //must be 64 chracters long
        total_bounty_amount: total_bounty_amount,
        bounty_amount_per_round: bounty_amount_per_round,
        submission_window: submission_window,
        round_time: round_time,
        audit_window: audit_window,
        minimum_stake_amount: minimum_stake_amount,        
        task_metadata: task_metadata,
        task_locals: local_vars,
        allowed_failed_distributions: allowed_failed_distributions,
        mint_address: mint_address,
        mint_digits: mint_digits
      };
    
    console.log(createTaskData);
    /** Create Account Part */
    // const wallet = token_account;
    const stakePot = getStakePotAccount();
    const taskState = Keypair.generate();
    /** Create Task Part */
    const taskStateInfo = await connection.getAccountInfo(taskState.publicKey);

    let tokenAccountWallet = await getOrCreateAssociatedTokenAccount(connection as any, payerWallet, new PublicKey(mint_address), payerWallet.publicKey);
    let lamports = await connection.getMinimumBalanceForRentExemption(0)
    if (taskStateInfo === null) {
        const createTaskStateTransaction = new Transaction().add(
        SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: taskState.publicKey,
                lamports: lamports,
                space: 0,
                programId: programId,
            })
        );
        await sendAndConfirmTransaction(connection, createTaskStateTransaction, [payer, taskState]);
    }

    let tx = await createTaskInstruction(createTaskData, {
        payer: payer.publicKey,
        wallet: new PublicKey(tokenAccountWallet.address),
        taskState: taskState.publicKey,
        stakePot: stakePot.publicKey,
        programId
    });
    await sendAndConfirmTransaction(connection, new Transaction().add(tx), [payer, taskState, stakePot]);
    return { taskStateInfoKeypair : taskState, stake_pot_account_pubkey : stakePot.publicKey };
  }
  export async function FundTask(
    payerWallet: Keypair,
    taskStateInfoAddress: PublicKey,
    stakePotAccount: PublicKey,
    amount: number,
    mint_address: string,
  ): Promise<void> {
    let mint_digits = await getKPLDigits(mint_address, connection);
    let tx = await fundTaskInstruction({
      amount,
      mint_address,
      mint_digits
    }, {
      taskState: taskStateInfoAddress,
      stakePot: stakePotAccount,
      submitter: payerWallet.publicKey,
      programId
  });
    await sendAndConfirmTransaction(connection, new Transaction().add(tx), [payerWallet]);
  }

  export async function updateTask(
    payerWallet: Keypair,
    task_name: string,
    task_audit_program: string,
    bounty_amount_per_round: number,
    space: number,
    task_description: string,
    task_executable_network: string,
    round_time: number,
    audit_window: number,
    submission_window: number,
    minimum_stake_amount: number,
    task_metadata: string,
    local_vars: string,
    allowed_failed_distributions: number,
    taskAccountInfoPubKey: PublicKey,
    stake_pot_account_pubkey: PublicKey,
    mint_address: string,
  ): Promise<{
    newTaskStateInfoKeypair: Keypair;
    newStake_pot_account_pubkey: PublicKey;
  }> {
    const mint_digits = await getKPLDigits(mint_address, connection);
    const stakePot = stake_pot_account_pubkey;
    const taskStatepubkey = taskAccountInfoPubKey;
    const newTaskState = await Keypair.generate();
    const newStakePot = await getStakePotAccount();
    const newTaskStateInfo = await connection.getAccountInfo(newTaskState.publicKey);

    let lamports = await connection.getMinimumBalanceForRentExemption(0)
    if (newTaskStateInfo === null) {
        const createTaskStateTransaction = new Transaction().add(
        SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: newTaskState.publicKey,
                lamports: lamports,
                space: 0,
                programId: programId,
            })
        );
        await sendAndConfirmTransaction(connection, createTaskStateTransaction, [payer, newTaskState]);
    }

    let tx = await updateTaskInstruction({
        task_name: task_name,
        task_description: task_description,
        task_audit_program: task_audit_program,
        task_executable_network: task_executable_network,
        bounty_amount_per_round: bounty_amount_per_round,
        round_time: round_time,
        audit_window: audit_window,
        submission_window: submission_window,
        minimum_stake_amount: minimum_stake_amount,
        task_metadata: task_metadata,
        task_locals: local_vars,
        allowed_failed_distributions: allowed_failed_distributions,
        mint_address,
        mint_digits
    }, {
        payer: payer.publicKey,
        taskState: taskStatepubkey,
        stakePot: stakePot,
        newStakePot: newStakePot.publicKey,
        newTaskState: newTaskState.publicKey,
        programId
    });
    await sendAndConfirmTransaction(connection, new Transaction().add(tx), [payer, newTaskState, newStakePot]);
    return { newTaskStateInfoKeypair: newTaskState, newStake_pot_account_pubkey: newStakePot.publicKey };
  }
  export async function SetActive(
    payerWallet: Keypair,
    taskStateInfoAddress: PublicKey,
    setActive: boolean
  ): Promise<void> {
    let isActive: number = setActive ? 1 : 0;
    let programId = await checkProgram();
    console.log({
      taskState: taskStateInfoAddress,
      ownerOrManager: payerWallet.publicKey,
      programId
  })
    let tx = await setActiveInstruction({is_active: isActive}, {
        taskState: taskStateInfoAddress,
        ownerOrManager: payerWallet.publicKey,
        programId
    });

    await sendAndConfirmTransaction(connection, new Transaction().add(tx), [payerWallet]);
  }
  export async function ClaimReward(
    payerWallet: Keypair,
    taskStateInfoAddress: PublicKey,
    stakePotAccount: PublicKey,
    beneficiaryAccount: PublicKey,
    claimerKeypairPath: string,
    mint_address: string
  ): Promise<void> {
    const submitterWallet = await createKeypairFromFile(claimerKeypairPath);
    let beneficiary = await PublicKey.findProgramAddressSync(
        [
            submitterWallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            new PublicKey(mint_address).toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
    console.log("beneficiaryAccount", beneficiary.toBase58())
    console.log({
      taskState: taskStateInfoAddress,
      stakePot: stakePotAccount,
      claimer: submitterWallet.publicKey,
      beneficiary: beneficiaryAccount,
      programId
  })
    let tx = await claimRewardInstruction({
        taskState: taskStateInfoAddress,
        stakePot: stakePotAccount,
        claimer: submitterWallet.publicKey,
        beneficiary: beneficiaryAccount,
        programId
    });
    await sendAndConfirmTransaction(connection, new Transaction().add(tx), [submitterWallet])
  }

  export async function Withdraw(
    payerWallet: Keypair,
    taskStateInfoAddress: PublicKey,
    submitterKeypair: Keypair
  ): Promise<void> {
    let tx = await withdrawInstruction({
      taskState: taskStateInfoAddress,
      submitter: submitterKeypair.publicKey,
      programId
  });
  }