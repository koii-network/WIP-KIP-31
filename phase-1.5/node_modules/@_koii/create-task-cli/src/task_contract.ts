/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from "@_koii/web3.js";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BufferLayout = require("@solana/buffer-layout");
const rustString = (property = "string") => {
  const rsl = BufferLayout.struct(
    [
      BufferLayout.u32("length"),
      BufferLayout.u32("lengthPadding"),
      BufferLayout.blob(BufferLayout.offset(BufferLayout.u32(), -8), "chars"),
    ],
    property
  );
  const _decode = rsl.decode.bind(rsl);
  const _encode = rsl.encode.bind(rsl);

  rsl.decode = (buffer: any, offset: any) => {
    const data = _decode(buffer, offset);
    return data["chars"].toString("utf8");
  };

  rsl.encode = (str: any, buffer: any, offset: any) => {
    const data = {
      chars: Buffer.from(str, "utf8"),
    };
    return _encode(data, buffer, offset);
  };

  rsl.alloc = (str: any) => {
    return (
      BufferLayout.u32().span +
      BufferLayout.u32().span +
      Buffer.from(str, "utf8").length
    );
  };

  return rsl;
};
const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};
const toBuffer = (arr: any) => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};
import { getPayer, getRpcUrl, createKeypairFromFile } from "./utils";

const SYSTEM_PUBLIC_KEY = new PublicKey("11111111111111111111111111111111");
const CLOCK_PUBLIC_KEY = new PublicKey(
  "SysvarC1ock11111111111111111111111111111111"
);
// let STAKE_POT_ACCOUNT: PublicKey;
// =new PublicKey("9XABSvWLMkUV1hPb4bXbJqvsH3Ab2mptxMMMnxfJUvG9")
/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Hello world's program id
 */
let programId: PublicKey;

/**
 * Path to the keypair of the deployed program.
 * This file is created when running `solana program deploy task_contract-keypair.json`
 */
// const PROGRAM_KEYPAIR_PATH = 'TaskMDbVartWDkgHrWZ6NiHUQUwdWpN3WDyRmSEoMTm.json';

const TASK_INSTRUCTION_LAYOUTS: any = Object.freeze({
  CreateTask: {
    index: 0,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.blob(24, "task_name"),
      BufferLayout.blob(64, "task_description"),
      BufferLayout.blob(64, "task_audit_program"),
      BufferLayout.blob(64, "task_executable_network"),
      BufferLayout.ns64("total_bounty_amount"),
      BufferLayout.ns64("bounty_amount_per_round"),
      BufferLayout.ns64("round_time"),
      BufferLayout.ns64("audit_window"),
      BufferLayout.ns64("submission_window"),
      BufferLayout.ns64("minimum_stake_amount"),
      BufferLayout.blob(64, "task_metadata"),
      BufferLayout.blob(64, "local_vars"),
      BufferLayout.ns64("allowed_failed_distributions"),

      // publicKey('stake_pot_account')
    ]),
  },
  UpdateTask: {
    index: 14,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.blob(24, "task_name"),
      BufferLayout.blob(64, "task_description"),
      BufferLayout.blob(64, "task_audit_program"),
      BufferLayout.blob(64, "task_executable_network"),
      BufferLayout.ns64("bounty_amount_per_round"),
      BufferLayout.ns64("round_time"),
      BufferLayout.ns64("audit_window"),
      BufferLayout.ns64("submission_window"),
      BufferLayout.ns64("minimum_stake_amount"),
      BufferLayout.blob(64, "task_metadata"),
      BufferLayout.blob(64, "local_vars"),
      BufferLayout.ns64("allowed_failed_distributions"),
    ]),
  },

  SubmitTask: {
    index: 1,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.blob(512, "submission"),
      BufferLayout.ns64("round"),
    ]),
  },
  AuditSubmissions: {
    index: 2,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("is_valid"),
      BufferLayout.ns64("round"),
    ]),
  },
  AuditDistribution: {
    index: 3,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("is_valid"),
      BufferLayout.ns64("round"),
    ]),
  },
  Payout: {
    index: 4,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("round"),
    ]),
  },
  Whitelist: {
    index: 5,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("isWhitelisted"),
    ]),
  },
  SetActive: {
    index: 6,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("isActive"),
    ]),
  },
  ClaimReward: {
    index: 7,
    layout: BufferLayout.struct([BufferLayout.u8("instruction")]),
  },
  FundTask: {
    index: 8,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("amount"),
    ]),
  },
  Stake: {
    index: 9,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("stakeAmount"),
    ]),
  },
  Withdraw: {
    //WithDraw Stake
    index: 10,
    layout: BufferLayout.struct([BufferLayout.u8("instruction")]),
  },
  UploadDistributionList: {
    //Upload Distribution complex flow, seperate script
    index: 11,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.blob(512, "instruction_data"),
    ]),
  },
  SubmitDistributionList: {
    //WithDraw Stake
    index: 12,
    layout: BufferLayout.struct([
      BufferLayout.u8("instruction"),
      BufferLayout.ns64("round"),
    ]),
  },
});

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<Connection> {
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, "confirmed");
  const version = await connection.getVersion();
  console.log("Connection to cluster established:", rpcUrl, version);
  return connection;
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(payerWallet: Keypair): Promise<void> {
  let fees = 0;
  if (!payerWallet) {
    const { feeCalculator } = await connection.getRecentBlockhash();

    // Calculate the cost to fund the greeter account
    fees += await connection.getMinimumBalanceForRentExemption(1000);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    payerWallet = await getPayer();
  }

  const lamports = await connection.getBalance(payerWallet.publicKey);
  if (lamports < fees) {
    console.error(
      "Your balance is not sufficient: " + payerWallet.publicKey.toBase58
    );
    process.exit(0);
    // If current balance is not enough to pay for fees, request an airdrop
    // const sig = await connection.requestAirdrop(payer.publicKey, 100000000000 + fees - lamports);
    // await connection.confirmTransaction(sig);
    // lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    "Using account",
    payerWallet.publicKey.toBase58(),
    "containing",
    lamports / LAMPORTS_PER_SOL,
    "KOII to pay for fees"
  );
}

/**
 * Check if the hello world BPF program has been deployed
 */
export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  try {
    programId = new PublicKey("Koiitask22222222222222222222222222222222222");
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
  console.log(`Using program ${programId.toBase58()}`);
}
function encodeData(type: any, fields: any) {
  const allocLength =
    type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({ instruction: type.index }, fields);
  type.layout.encode(layoutFields, data);
  return data;
}
function getAlloc(type: any, fields: any) {
  let alloc = 0;
  type.layout.fields.forEach((item: any) => {
    if (item.span >= 0) {
      alloc += item.span;
    } else if (typeof item.alloc === "function") {
      alloc += item.alloc(fields[item.property]);
    }
  });
  return alloc;
}

function padStringWithSpaces(input: string, length: number) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(input);
  const padding = length - encoded.length;
  const spaces = new Uint8Array(padding).fill(32); // 32 is the ASCII code for space

  const paddedArray = new Uint8Array(encoded.length + padding);
  paddedArray.set(encoded);
  paddedArray.set(spaces, encoded.length);

  return new TextDecoder().decode(paddedArray);
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
  allowed_failed_distributions: number
): Promise<any> {
  // Checks
  if (round_time < audit_window + submission_window)
    throw new Error(
      "Round time cannot be less than audit_window + submission_window"
    );
  if (task_description.length > 64)
    throw new Error("task_description cannot be greater than 64 characters");

  const createTaskData = {
    task_name: new TextEncoder().encode(padStringWithSpaces(task_name, 24)),
    task_description: new TextEncoder().encode(
      padStringWithSpaces(task_description, 64)
    ),
    task_audit_program: new TextEncoder().encode(
      padStringWithSpaces(task_audit_program, 64)
    ), //must be 64 chracters long
    task_executable_network: new TextEncoder().encode(
      padStringWithSpaces(task_executable_network, 64)
    ), //must be 64 chracters long
    total_bounty_amount: total_bounty_amount * LAMPORTS_PER_SOL,
    bounty_amount_per_round: bounty_amount_per_round * LAMPORTS_PER_SOL,
    round_time: round_time,
    audit_window: audit_window,
    submission_window: submission_window,
    rentExemptionAmount:
      (await connection.getMinimumBalanceForRentExemption(space)) + 1000,
    space: space,
    minimum_stake_amount: minimum_stake_amount * LAMPORTS_PER_SOL,
    task_metadata: new TextEncoder().encode(
      padStringWithSpaces(task_metadata, 64)
    ),
    local_vars: new TextEncoder().encode(padStringWithSpaces(local_vars, 64)),
    allowed_failed_distributions: allowed_failed_distributions,

    // koii_vars:new TextEncoder().encode(padStringWithSpaces(task_metadata,64))
  };
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.CreateTask, createTaskData);
  const taskStateInfoKeypair = Keypair.generate();
  const stake_pot_account_pubkey: PublicKey = getStakePotAccount();

  const createTaskStateTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: taskStateInfoKeypair.publicKey,
      lamports: createTaskData.rentExemptionAmount,
      space: createTaskData.space,
      programId: programId,
    })
  );
  const keys = [
    { pubkey: payerWallet.publicKey, isSigner: true, isWritable: true },
    {
      pubkey: taskStateInfoKeypair.publicKey,
      isSigner: true,
      isWritable: true,
    },
    { pubkey: stake_pot_account_pubkey, isSigner: false, isWritable: true },
    { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
  ];
  if (koii_vars)
    [
      keys.push({
        pubkey: new PublicKey(koii_vars),
        isSigner: false,
        isWritable: false,
      }),
    ];
  await sendAndConfirmTransaction(connection, createTaskStateTransaction, [
    payerWallet,
    taskStateInfoKeypair,
  ]);
  try {
    const instruction = new TransactionInstruction({
      keys,
      programId,
      data: data,
    });
    await sendAndConfirmTransactionAndRetryTransaction(
      connection,
      new Transaction().add(instruction),
      [payerWallet, taskStateInfoKeypair]
    );
    // Transfer to stakepot account
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payerWallet.publicKey,
        toPubkey: stake_pot_account_pubkey,
        lamports: 0.001 * LAMPORTS_PER_SOL,
      })
    );
    await sendAndConfirmTransactionAndRetryTransaction(connection, transferTx, [payerWallet]);
  } catch (e: any) {
    console.error(e);
  }
  return { taskStateInfoKeypair, stake_pot_account_pubkey };
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
  statePotAccountPubKey: PublicKey
): Promise<{
  newTaskStateInfoKeypair: Keypair;
  newStake_pot_account_pubkey: PublicKey;
}> {
  // Checks
  if (round_time < audit_window + submission_window)
    throw new Error(
      "Round time cannot be less than audit_window + submission_window"
    );
  if (task_description.length > 64)
    throw new Error("task_description cannot be greater than 64 characters");

  const updateTaskData = {
    task_name: new TextEncoder().encode(padStringWithSpaces(task_name, 24)),
    task_description: new TextEncoder().encode(
      padStringWithSpaces(task_description, 64)
    ),
    task_audit_program: new TextEncoder().encode(
      padStringWithSpaces(task_audit_program, 64)
    ), //must be 64 chracters long
    task_executable_network: new TextEncoder().encode(
      padStringWithSpaces(task_executable_network, 64)
    ), //must be 64 chracters long
    bounty_amount_per_round: bounty_amount_per_round * LAMPORTS_PER_SOL,
    round_time: round_time,
    audit_window: audit_window,
    submission_window: submission_window,
    rentExemptionAmount:
      (await connection.getMinimumBalanceForRentExemption(space)) + 1000,
    space: space,
    minimum_stake_amount: minimum_stake_amount * LAMPORTS_PER_SOL,
    task_metadata: new TextEncoder().encode(
      padStringWithSpaces(task_metadata, 64)
    ),
    local_vars: new TextEncoder().encode(padStringWithSpaces(local_vars, 64)),
    allowed_failed_distributions: allowed_failed_distributions,
  };
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.UpdateTask, updateTaskData);
  const newTaskStateInfoKeypair = Keypair.generate();
  const newStake_pot_account_pubkey: PublicKey = getStakePotAccount();

  const createTaskStateTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: newTaskStateInfoKeypair.publicKey,
      lamports: updateTaskData.rentExemptionAmount,
      space: updateTaskData.space,
      programId: programId,
    })
  );
  const keys = [
    { pubkey: payerWallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: taskAccountInfoPubKey, isSigner: false, isWritable: true },
    { pubkey: statePotAccountPubKey, isSigner: false, isWritable: true },
    { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
    {
      pubkey: newTaskStateInfoKeypair.publicKey,
      isSigner: true,
      isWritable: true,
    },
    { pubkey: newStake_pot_account_pubkey, isSigner: false, isWritable: true },
  ];
  // if (koii_vars) [
  //   keys.push({
  //     pubkey: new PublicKey(koii_vars), isSigner: false, isWritable: false
  //   })
  // ]
  await sendAndConfirmTransaction(connection, createTaskStateTransaction, [
    payerWallet,
    newTaskStateInfoKeypair,
  ]);
  const instruction = new TransactionInstruction({
    keys,
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerWallet, newTaskStateInfoKeypair]
  );
  return { newTaskStateInfoKeypair, newStake_pot_account_pubkey };
}

async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function Whitelist(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  PROGRAM_KEYPAIR_PATH: string,
  isWhitelisted: boolean
): Promise<void> {
  const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);

  console.log("WHITELIST", programKeypair.publicKey.toBase58());
  const [managerAccountPDA] = await PublicKey.findProgramAddress(
    [Buffer.from('manager')],
    programId,
  );
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Whitelist, {
    isWhitelisted,
  });
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: programKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: managerAccountPDA, isSigner: false, isWritable: false },
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerWallet, programKeypair]
  );
}
export async function SetActive(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  setActive: boolean
): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.SetActive, {
    isActive: setActive ? 1 : 0,
  });
  const [managerAccountPDA] = await PublicKey.findProgramAddress(
    [Buffer.from('manager')],
    programId,
  );
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: payerWallet.publicKey, isSigner: true, isWritable: false },
      { pubkey: managerAccountPDA, isSigner: false, isWritable: false },
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerWallet]
  );
}

export async function ClaimReward(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  beneficiaryAccount: PublicKey,
  claimerKeypairPath: string
): Promise<void> {
  const claimerKeypair = await createKeypairFromFile(claimerKeypairPath);
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.ClaimReward, {});
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: claimerKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: stakePotAccount, isSigner: false, isWritable: true },
      { pubkey: beneficiaryAccount, isSigner: false, isWritable: true },
    ],
    programId,
    data: data,
  });
  const signature = await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerWallet, claimerKeypair]
  );
  console.log(`Claimed reward with signature: ${signature}`);
}

export async function FundTask(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  amount: number
): Promise<void> {
  const amountInRoe = amount * LAMPORTS_PER_SOL;
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.FundTask, {
    amountInRoe,
  });
  const funderKeypair = Keypair.generate();
  console.log("Making new account", funderKeypair.publicKey.toBase58());
  await saveFunderKeypair(funderKeypair);
  const createSubmitterAccTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerWallet.publicKey,
      newAccountPubkey: funderKeypair.publicKey,
      lamports:
        amountInRoe +
        (await connection.getMinimumBalanceForRentExemption(100)) +
        1000, //adding 1000 extra lamports for padding
      space: 100,
      programId: programId,
    })
  );
  await sendAndConfirmTransaction(connection, createSubmitterAccTransaction, [
    payerWallet,
    funderKeypair,
  ]);
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: funderKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: stakePotAccount, isSigner: false, isWritable: true },
      { pubkey: SYSTEM_PUBLIC_KEY, isSigner: false, isWritable: false },
      { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
    ],
    programId,
    data: data,
  });
  try {
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payerWallet, funderKeypair]
    );
  } catch (error) {
    console.error("First attempt to send transaction failed:", error); 
    try {
      await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payerWallet, funderKeypair]
      );
    } catch (retryError) {
      console.error("Retry attempt to send transaction failed:", retryError);
      // Save the funderKeypair for future us 
      console.log(`[${funderKeypair.secretKey.toString()}]`);
      console.log("Please keep this keypair to retry funding the task.")
    }
  }
}

export async function FundTaskFromMiddleAccount(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  stakePotAccount: PublicKey,
  amount: number,
  funderKeypair: Keypair
): Promise<void> {
  const amountInRoe = amount * LAMPORTS_PER_SOL;
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.FundTask, {
    amountInRoe,
  });

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: funderKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: stakePotAccount, isSigner: false, isWritable: true },
      { pubkey: SYSTEM_PUBLIC_KEY, isSigner: false, isWritable: false },
      { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
    ],
    programId,
    data: data,
  });
  try {
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payerWallet, funderKeypair]
    );
  } catch (error) {
    console.error("First attempt to send transaction failed:", error); 
    try {
      await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payerWallet, funderKeypair]
      );
    } catch (retryError) {
      console.error("Retry attempt to send transaction failed:", retryError);
    }
  }
}

async function saveFunderKeypair(funderKeypair: Keypair): Promise<void> {
  try{
  const keypairJson = `[${funderKeypair.secretKey.toString()}]`;
  const filePath = `./funder-keypair-${funderKeypair.publicKey.toBase58()}.json`;
  fs.writeFileSync(filePath, keypairJson);
  console.log("Saved funderKeypair to", filePath);
  } catch (error) {
    console.error("Failed to save funderKeypair:", error);
  }
}

function getStakePotAccount(): PublicKey {
  let pubkey;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const keypair = new Keypair();
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
  return pubkey;
}
export async function Withdraw(
  payerWallet: Keypair,
  taskStateInfoAddress: PublicKey,
  submitterKeypair: Keypair
): Promise<void> {
  const data = encodeData(TASK_INSTRUCTION_LAYOUTS.Withdraw, {});

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: taskStateInfoAddress, isSigner: false, isWritable: true },
      { pubkey: submitterKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: CLOCK_PUBLIC_KEY, isSigner: false, isWritable: false },
    ],
    programId,
    data: data,
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerWallet, submitterKeypair]
  );
}


const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendAndConfirmTransactionAndRetryTransaction(connection: Connection, transaction: Transaction, signers : Keypair[], retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
      try {        
        // Attempt to send and confirm the transaction
        await sendAndConfirmTransaction(connection, transaction, signers);
        return; // Success, exit the function
      } catch (error) {
        console.error(`Transaction failed on attempt ${attempt + 1}:`, error);
        attempt++;
        if (attempt < retries) {
          console.log(`Retrying in...`);
          for (let i = 3; i > 0; i--) {
            console.log(`${i} second(s)`);
            await delay(1000); // Delay for 1 second, counting down from 3
          }
        } else {
          throw new Error('Transaction failed after maximum retries');
        }
      }
    }
  }