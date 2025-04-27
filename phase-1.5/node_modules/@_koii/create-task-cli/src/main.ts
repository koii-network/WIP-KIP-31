#!/usr/bin/env node

import {
  establishConnection,
  establishPayer,
  checkProgram,
  createTask,
  updateTask,
  SetActive,
  ClaimReward,
  FundTask,
  Withdraw,
  FundTaskFromMiddleAccount,
} from "./task_contract"; 

import { 
  createTask as KPLCreateTask,
  establishPayer as KPLEstablishPayer,
  establishConnection as KPLEstablishConnection,
  checkProgram as KPLCheckProgram,
  FundTask as KPLFundTask,
  ClaimReward as KPLClaimReward,
  SetActive as KPLSetActive,
  Withdraw as KPLWithdraw,
  updateTask as KPLUpdateTask,
 } from "./kpl_task_contract/task-program";
import { uploadExecutableFileToIpfs } from "./utils";
import { getConfig } from "./utils";
import prompts from "prompts";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@_koii/web3.js";
import { Keypair as SolanaKeypair, PublicKey as SolanaPublicKey } from "@solana/web3.js";
import fs from "fs";
import { config } from "dotenv";
import path from "path";
import handleMetadata from "./metadata";
import validateTaskInputs from "./validate";
import validateUpdateTaskInputs from "./validateUpdate";
import { join } from "path";
import { tmpdir, homedir } from "os";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { KoiiStorageClient } from "@_koii/storage-task-sdk";
import readYamlFile from "read-yaml-file";
import fetch from "node-fetch";
import { createWriteStream } from "fs";
import StreamZip from "node-stream-zip";
import { check } from "prettier";
config();

interface Task {
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  total_bounty_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}

interface UpdateTask {
  task_id: string;
  task_name: string;
  task_executable_network: "DEVELOPMENT" | "ARWEAVE" | "IPFS";
  secret_web3_storage_key: string;
  task_audit_program?: string;
  task_audit_program_id?: string;
  round_time: number;
  audit_window: number;
  submission_window: number;
  minimum_stake_amount: number;
  bounty_amount_per_round: number;
  allowed_failed_distributions: number;
  space: number;
}

interface TaskMetadata {
  author: string;
  description: string;
  repositoryUrl: string;
  createdAt: number;
  migrationDescription?: string;
  imageUrl?: string | undefined;
  requirementsTags?: RequirementTag[];
}

interface RequirementTag {
  type: RequirementType;
  value?: string | string[]; // defined if given requirement needs a specific value
  description?: string;
}

enum RequirementType {
  GLOBAL_VARIABLE = "GLOBAL_VARIABLE",
  TASK_VARIABLE = "TASK_VARIABLE",
  CPU = "CPU",
  RAM = "RAM",
  STORAGE = "STORAGE",
  NETWORK = "NETWORK",
  ARCHITECTURE = "ARCHITECTURE",
  OS = "OS",
}
let ISKPLTask:string; 
async function checkIsKPLTask(){
  ISKPLTask = (
    await prompts({
      type: "select",
      name: "kpltask",
      message: "Select operation",
  
      choices: [
        { title: "KOII-Task", value: "no" },
        { title: "KPL-Task", value: "yes" },
      ],
    })
  ).kpltask;
  console.log("ISKPLTask", ISKPLTask);
}
async function initializeConnection(walletPath: string) {
  let payerWallet: Keypair;
  let isConfirm = true;
  if (fs.existsSync(walletPath)) {
    isConfirm = (
      await prompts({
        type: "confirm",
        name: "value",
        message: `It looks like you have a koii cli installed. Would you like to use your koii cli key (${walletPath}) to deploy this task?`,
      })
    ).value;
  }
  if (!fs.existsSync(walletPath) || !isConfirm) {
    // Above check is for the koii cli wallet config file
    const mainWalletDesktopNodePath =
      getWalletPathFromDesktopNode("MainWallet");
    if (mainWalletDesktopNodePath && fs.existsSync(mainWalletDesktopNodePath)) {
      isConfirm = (
        await prompts({
          type: "confirm",
          name: "value",
          message: `It looks like you have a desktop node installed. Would you like to use your desktop node key (${mainWalletDesktopNodePath}) to deploy this task?`,
        })
      ).value;
      if (isConfirm) {
        walletPath = mainWalletDesktopNodePath;
      }
    }
    if (!fs.existsSync(walletPath) || !isConfirm) {
      walletPath = (
        await prompts({
          type: "text",
          name: "walletPath",
          message: "Enter the path to your wallet",
        })
      ).walletPath;
      walletPath = sanitizePath(walletPath);
      if (!fs.existsSync(walletPath)) {
        throw Error("Please make sure that the wallet path is correct");
      }
    }
  }
  console.log("Wallet path: ", walletPath);

  try {
    const wallet = fs.readFileSync(walletPath, "utf-8");
    payerWallet = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(wallet)));
  } catch (e) {
    console.error("Wallet is not valid");
    //console.error(logSymbols.error, "Wallet is not valid");
    process.exit();
  }
  // Establish connection to the cluster
  const connection = await establishConnection();
  const KPLConnection = await KPLEstablishConnection(); 
  
  // Determine who pays for the fees
  await establishPayer(payerWallet);
  await KPLEstablishPayer(payerWallet as unknown as SolanaKeypair);

  // Check if the program has been deployed
  await checkProgram();
  await KPLCheckProgram();
  return { walletPath, payerWallet, connection };
}
const sanitizePath = (path:string) => {
  let sanitizedPath = path.trim();
  sanitizedPath = sanitizedPath.replace(/[<>"'|?*]/g, '');
  return sanitizedPath;
};

async function main() {
  let walletPath;
  let config;

  try {
    config = await getConfig();
    walletPath = config.keypair_path;
  } catch (error) {
    walletPath = path.resolve(homedir(), ".config", "koii", "id.json");
  }

  const mode = (
    await prompts({
      type: "select",
      name: "mode",
      message: "Select operation",

      choices: [
        { title: "Create a New Local Repository", value: "create-repo" },
        { title: "Deploy a New Task", value: "create-task" },
        { title: "Update Existing Task", value: "update-task" },
        { title: "Activate/Deactivate Task", value: "set-active" },
        { title: "Claim Reward", value: "claim-reward" },
        { title: "Fund Task with More KOII", value: "fund-task" },
        { title: "Withdraw Staked Funds from Task", value: "withdraw" },
        {
          title: "Upload Assets to IPFS (Metadata/Local Vars)",
          value: "handle-assets",
        },
      ],
    })
  ).mode;

  console.log(mode);

  const downloadRepo = async () => {
    const repoZipUrl =
      "https://github.com/koii-network/task-template/archive/refs/heads/master.zip";
    const outputPath = path.resolve(process.cwd(), "task-template.zip");
    const outputDir = path.resolve(process.cwd(), "task-template");

    try {
      const res = await fetch(repoZipUrl);
      if (!res.ok) throw new Error("Failed to download the repository");

      const fileStream = fs.createWriteStream(outputPath);
      await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
      });

      console.log(`Download completed, saved as ${outputPath}`);

      const zip = new StreamZip.async({ file: outputPath });
      await zip.extract(null, outputDir);
      await zip.close();

      console.log(`Repository has been extracted to ${outputDir}`);
      console.log(
        "Template creation complete! Please check https://docs.koii.network/develop/onboarding/welcome-to-koii for dev guide! Happy coding!"
      );
    } catch (error) {
      console.error(`Error: ${error}`);
    } finally {
      // Clean up the zip file after extraction
      fs.unlink(outputPath, (err) => {
        if (err) {
          console.error(`Error removing temporary zip file: ${err.message}`);
        } else {
          console.log(`Temporary zip file removed.`);
        }
      });
    }
  };

  switch (mode) {
    case "create-repo": {
      await downloadRepo();
      break;
    }

    case "create-task": {
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      const taskMode = (
        await prompts({
          type: "select",
          name: "mode",
          message: "Select operation",

          choices: [
            { title: "using CLI", value: "create-task-cli" },
            { title: "using config YML", value: "create-task-yml" },
          ],
        })
      ).mode;
      console.log(taskMode);

      switch (taskMode) {
        case "create-task-cli": {
          const {
            task_name,
            task_audit_program_id,
            total_bounty_amount,
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            allowed_failed_distributions,
          } = await takeInputForCreateTask(true);
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          const minimumBalanceForRentExemption =
            (await connection.getMinimumBalanceForRentExemption(
              space * 1000000
            )) + 10000;
          const totalAmount =
            LAMPORTS_PER_SOL * total_bounty_amount +
            minimumBalanceForRentExemption;
          const response = (
            await prompts({
              type: "confirm",
              name: "response",
              message: `Your account will be deducted ${
                totalAmount / LAMPORTS_PER_SOL
              } KOII for creating the task, which includes the rent exemption(${
                minimumBalanceForRentExemption / LAMPORTS_PER_SOL
              } KOII) and bounty amount fees (${total_bounty_amount} KOII)`,
            })
          ).response;

          if (!response) process.exit(0);
          const lamports = await connection.getBalance(payerWallet.publicKey);
          if (lamports < totalAmount) {
            console.error("Insufficient balance for this operation");
            process.exit(0);
          }
          console.log("Calling Create Task");
          // TODO: All params for the createTask should be accepted from cli input and should be replaced in the function below
          const { taskStateInfoKeypair, stake_pot_account_pubkey } =
            await createTask(
              payerWallet,
              task_name,
              task_audit_program_id,
              total_bounty_amount,
              bounty_amount_per_round,
              space * 1000000,
              task_description?.substring(0, 50),
              task_executable_network,
              round_time,
              audit_window,
              submission_window,
              minimum_stake_amount,
              task_metadata,
              "",
              "",
              allowed_failed_distributions
            );
          fs.writeFileSync(
            "taskStateInfoKeypair.json",
            JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
          );
          console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
          console.log(
            "Stake Pot Account Pubkey:",
            stake_pot_account_pubkey.toBase58()
          );
          console.log(
            "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
          );
          break;
        }

        case "create-task-yml": {
          let metaDataCid: string;
          let task_audit_program_id: string;
          let stakingWalletKeypair: Keypair;

          const currentDir = path.resolve(process.cwd());
          let ymlPath = `${currentDir}/config-task.yml`;

          if (!fs.existsSync(ymlPath)) {
            ymlPath = (
              await prompts({
                type: "text",
                name: "ymlPath",
                message: "Enter the path to your config-task.yml file",
              })
            ).ymlPath;
            ymlPath = sanitizePath(ymlPath);
            if (
              !fs.existsSync(ymlPath) ||
              (!ymlPath.includes(".yml") && !ymlPath.includes(".yaml"))
            ) {
              throw Error(
                "Please make sure that the path to your config-task.yml file is correct."
              );
            }
          }

          await readYamlFile(ymlPath).then(async (data: any) => {
            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              imageUrl: data.imageUrl,
              requirementsTags: data.requirementsTags,
            };
            fs.writeFileSync("./metadata.json", JSON.stringify(metaData));

            if (data.task_executable_network == "IPFS") {
              const ipfsMode = (
                await prompts({
                  type: "select",
                  name: "mode",
                  message: "Select operation",

                  choices: [
                    { title: "Using KOII Storage SDK", value: "koii-storage" },
                    { title: "Manually Input IPFS", value: "manual" },
                  ],
                })
              ).mode;
              if (ipfsMode == "manual") {
                const ipfsCid = (
                  await prompts({
                    type: "text",
                    name: "ipfsCid",
                    message: "Enter the IPFS CID",
                  })
                ).ipfsCid.trim();
                task_audit_program_id = ipfsCid;
                const ipfsData = (
                  await prompts({
                    type: "text",
                    name: "metadataCid",
                    message: "Enter the Metadata CID",
                  })
                ).metadataCid.trim();
                metaDataCid = ipfsData || "";
              } else {
                const storageClient = new KoiiStorageClient(
                  undefined,
                  undefined,
                  false
                );

                const stakingWalletDesktopNodePath =
                  getWalletPathFromDesktopNode("StakingWallet");
                let stakingWalletPath;
                let isConfirm = true;
                if (
                  stakingWalletDesktopNodePath &&
                  fs.existsSync(stakingWalletDesktopNodePath)
                ) {
                  isConfirm = (
                    await prompts({
                      type: "confirm",
                      name: "value",
                      message: `It looks like you have a desktop node installed. Would you like to use your desktop node staking key (${stakingWalletDesktopNodePath}) to sign this upload to IPFS?`,
                    })
                  ).value;
                  if (isConfirm) {
                    stakingWalletPath = stakingWalletDesktopNodePath;
                  }
                }
                if (!fs.existsSync(stakingWalletPath || "") || !isConfirm) {
                  // ask user to enter the stakingWallet Keypair path
                  stakingWalletPath = (
                    await prompts({
                      type: "text",
                      name: "stakingWalletPath",
                      message: "Enter the path to your staking wallet",
                    })
                  ).stakingWalletPath;
                }
                stakingWalletPath = sanitizePath(stakingWalletPath);
                if (!fs.existsSync(stakingWalletPath)) {
                  throw Error(
                    "Please make sure that the staking wallet path is correct"
                  );
                }
                const wallet = fs.readFileSync(stakingWalletPath, "utf-8");
                stakingWalletKeypair = Keypair.fromSecretKey(
                  Uint8Array.from(JSON.parse(wallet))
                );

                // Upload a main.js file
                task_audit_program_id = (
                  await storageClient.uploadFile(
                    data.task_audit_program,
                    stakingWalletKeypair
                  )
                ).cid;
                console.log("TASK CID", task_audit_program_id);

                // Upload a metadata.json file
                try {
                  const ipfsData = await storageClient.uploadFile(
                    "./metadata.json",
                    stakingWalletKeypair
                  );
                  metaDataCid = ipfsData.cid || "";
                } catch (err) {
                  console.error("IPFS upload faileds");
                  process.exit();
                }
                console.log(
                  "\x1b[1m\x1b[32m%s\x1b[0m",
                  `Your MetaData CID is ${metaDataCid}/metadata.json`
                );
              }
            } else if (
              data.task_executable_network == "ARWEAVE" ||
              data.task_executable_network == "DEVELOPMENT"
            ) {
              //console.log("IN DEVELOPMENT");
              task_audit_program_id = data.task_audit_program;
              metaDataCid = "metadata.json";
            } else {
              console.error(
                "Please specify the correct task_executable_network in YML"
              );
              process.exit();
            }
            await checkIsKPLTask();
            if (ISKPLTask === "yes") {
              
              let mint_address = (
                await prompts({
                  type: "text",
                  name: "mint_address",
                  message: "Enter the mint address of the token you want to use for the task",
                })
              ).mint_address;
              mint_address = mint_address.trim();
              const TaskData = {
                task_name: data.task_name.trim(),
                task_executable_network: data.task_executable_network,
                secret_web3_storage_key: data.secret_web3_storage_key,
                task_audit_program: data.task_audit_program,
                task_audit_program_id: task_audit_program_id,
                round_time: data.round_time,
                audit_window: data.audit_window,
                submission_window: data.submission_window,
                minimum_stake_amount: data.minimum_stake_amount,
                total_bounty_amount: data.total_bounty_amount,
                bounty_amount_per_round: data.bounty_amount_per_round,
                allowed_failed_distributions: data.allowed_failed_distributions,
                space: data.space,
                mint_address:mint_address
              };
              // TODO : Validate the inputs
              // TODO : Validate Rent
              // TODO : Check Cost with correct digit
              
              const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                data.space * 1000000
              )) + 10000;

            const totalAmount =
              LAMPORTS_PER_SOL * data.total_bounty_amount +
              minimumBalanceForRentExemption;
            const response = (
              await prompts({
                type: "confirm",
                name: "response",
                message: `Your account will be deducted rent exemption(${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and bounty amount fees (${
                  data.total_bounty_amount
                } Tokens)`,
              })
            ).response;
            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.error("Insufficient balance for this operation");
              process.exit(0);
            }

            console.log("Calling Create Task");
              // Before passing it to createTask validate the inputs
              const { taskStateInfoKeypair, stake_pot_account_pubkey } =
                await KPLCreateTask(
                  payerWallet as unknown as SolanaKeypair,
                  TaskData.task_name,
                  task_audit_program_id,
                  TaskData.total_bounty_amount,
                  TaskData.bounty_amount_per_round,
                  TaskData.space * 1000000,
                  data?.description?.substring(0, 50),
                  TaskData.task_executable_network,
                  TaskData.round_time,
                  TaskData.audit_window,
                  TaskData.submission_window,
                  TaskData.minimum_stake_amount,
                  metaDataCid,
                  "",
                  "",
                  TaskData.allowed_failed_distributions,
                  mint_address,
                );
                
              fs.writeFileSync(
                "taskStateInfoKeypair.json",
                JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
              );
              if (data.task_executable_network == "DEVELOPMENT") {
                fs.renameSync(
                  "metadata.json",
                  `dist/${taskStateInfoKeypair.publicKey.toBase58()}.json`
                );
              }
              console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
              console.log(
                "Stake Pot Account Pubkey:",
                stake_pot_account_pubkey.toBase58()
              );
              console.log(
                "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
              );
            }else{
                const TaskData: Task = {
                  task_name: data.task_name.trim(),
                  task_executable_network: data.task_executable_network,
                  secret_web3_storage_key: data.secret_web3_storage_key,
                  task_audit_program: data.task_audit_program,
                  task_audit_program_id: task_audit_program_id,
                  round_time: data.round_time,
                  audit_window: data.audit_window,
                  submission_window: data.submission_window,
                  minimum_stake_amount: data.minimum_stake_amount,
                  total_bounty_amount: data.total_bounty_amount,
                  bounty_amount_per_round: data.bounty_amount_per_round,
                  allowed_failed_distributions: data.allowed_failed_distributions,
                  space: data.space,
                };

         

                await validateTaskInputs(metaData, TaskData);

                // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]

                // Before pasing it to createTask validate the input
                const minimumBalanceForRentExemption =
                  (await connection.getMinimumBalanceForRentExemption(
                    data.space * 1000000
                  )) + 10000;

                const totalAmount =
                  LAMPORTS_PER_SOL * data.total_bounty_amount +
                  minimumBalanceForRentExemption;
                const response = (
                  await prompts({
                    type: "confirm",
                    name: "response",
                    message: `Your account will be deducted ${
                      totalAmount / LAMPORTS_PER_SOL
                    } KOII for creating the task, which includes the rent exemption(${
                      minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                    } KOII) and bounty amount fees (${
                      data.total_bounty_amount
                    } KOII)`,
                  })
                ).response;

                if (!response) process.exit(0);
                const lamports = await connection.getBalance(payerWallet.publicKey);
                if (lamports < totalAmount) {
                  console.error("Insufficient balance for this operation");
                  process.exit(0);
                }

                console.log("Calling Create Task");
                // Before passing it to createTask validate the inputs
                const { taskStateInfoKeypair, stake_pot_account_pubkey } =
                  await createTask(
                    payerWallet,
                    TaskData.task_name,
                    task_audit_program_id,
                    TaskData.total_bounty_amount,
                    TaskData.bounty_amount_per_round,
                    TaskData.space * 1000000,
                    data?.description?.substring(0, 50),
                    TaskData.task_executable_network,
                    TaskData.round_time,
                    TaskData.audit_window,
                    TaskData.submission_window,
                    TaskData.minimum_stake_amount,
                    metaDataCid,
                    "",
                    "",
                    TaskData.allowed_failed_distributions
                  );
                fs.writeFileSync(
                  "taskStateInfoKeypair.json",
                  JSON.stringify(Array.from(taskStateInfoKeypair.secretKey))
                );
                if (data.task_executable_network == "DEVELOPMENT") {
                  fs.renameSync(
                    "metadata.json",
                    `dist/${taskStateInfoKeypair.publicKey.toBase58()}.json`
                  );
                }
                console.log("Task Id:", taskStateInfoKeypair.publicKey.toBase58());
                console.log(
                  "Stake Pot Account Pubkey:",
                  stake_pot_account_pubkey.toBase58()
                );
                console.log(
                  "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
                );
              }
              });
              
          break;
        }
      }
      break;
    }
    case "set-active": {
      checkIsKPLTask();
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      console.log("Calling SetActive");
      const { isActive, taskStateInfoAddress } = await takeInputForSetActive();
      
      if (ISKPLTask === "yes") {
        await KPLSetActive(payerWallet as unknown as SolanaKeypair, taskStateInfoAddress as unknown as SolanaPublicKey, isActive);
      }else{
        await SetActive(payerWallet, taskStateInfoAddress, isActive);
      }
      break;
    }
    case "claim-reward": {
      await checkIsKPLTask();
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      console.log("Calling ClaimReward");
      const { beneficiaryAccount, taskStateInfoAddress, claimerKeypair } =
        await takeInputForClaimReward();
      const taskState = await connection.getAccountInfo(taskStateInfoAddress);
      let taskStateJSON = null;
      if (taskState && taskState.data) {
        if (ISKPLTask === "yes"){
          taskStateJSON = JSON.parse(taskState.data.toString().slice(4));
        }else{
          taskStateJSON = JSON.parse(taskState.data.toString());
        }
      } else {
        return console.error("Task not found");
      }
      const stake_pot_account = new PublicKey(taskStateJSON.stake_pot_account);
      console.log("Stake Pot Account", stake_pot_account.toString());
      if (ISKPLTask === "yes") {
        let mint_address = (
          await prompts({
            type: "text",
            name: "mint_address",
            message: "Enter the mint address of the token you want to use for the task",
          })
        ).mint_address;

        mint_address = mint_address.trim();
        await KPLClaimReward(
          payerWallet as unknown as SolanaKeypair,
          taskStateInfoAddress as unknown as SolanaPublicKey,
          stake_pot_account as unknown as SolanaPublicKey,
          beneficiaryAccount as unknown as SolanaPublicKey,
          claimerKeypair,
          mint_address
        );
      }else{
        await ClaimReward(
          payerWallet,
          taskStateInfoAddress,
          stake_pot_account,
          beneficiaryAccount,
          claimerKeypair
        );
      }
      break;
    }
    case "fund-task": {
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      console.log("Calling FundTask");
      await checkIsKPLTask();
      const { taskStateInfoAddress, amount } = await takeInputForFundTask();
      let middleWalletPath = (
        await prompts({
          type: "text",
          name: "middleWalletPath",
          message:
            "Enter the path of your retry wallet: (Leave empty unless for retry) ",
        })
      ).middleWalletPath;
      middleWalletPath = sanitizePath(middleWalletPath);
      const accountInfo = await connection.getAccountInfo(
        new PublicKey(taskStateInfoAddress)
      );

      if (accountInfo == null) {
        console.error("No task found with this Id");
        process.exit();
      }
      let state; 
      if (ISKPLTask === "yes") {
        const rawData: any = accountInfo.data + "";
        state = JSON.parse(rawData.toString().slice(4));
      }else{
        const rawData: any = accountInfo.data + "";
        state = JSON.parse(rawData);
      }
      const stakePotAccount = new PublicKey(state.stake_pot_account);
      if (middleWalletPath) {
        if (!fs.existsSync(middleWalletPath)) {
          throw Error(
            "Please make sure that the middle wallet path is correct"
          );
        }
        const wallet = fs.readFileSync(middleWalletPath, "utf-8");
        const middleWalletKeypair = Keypair.fromSecretKey(
          Uint8Array.from(JSON.parse(wallet))
        );
        await FundTaskFromMiddleAccount(
          payerWallet,
          taskStateInfoAddress,
          stakePotAccount,
          amount,
          middleWalletKeypair
        );
      }else{
   
        if (ISKPLTask === "yes") {
          let mint_address = (
            await prompts({
              type: "text",
              name: "mint_address",
              message: "Enter the mint address of the token you want to use for the task",
            })
          ).mint_address;
          mint_address = mint_address.trim();
          await KPLFundTask(
            payerWallet as unknown as SolanaKeypair,
            taskStateInfoAddress as unknown as SolanaPublicKey,
            stakePotAccount as unknown as SolanaPublicKey,
            amount,
            mint_address
          );
      } else {
        await FundTask(
          payerWallet,
          taskStateInfoAddress,
          stakePotAccount,
          amount
        );
      }
      }
      break;
    }
    case "withdraw": {
      await checkIsKPLTask();
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      console.log("Calling Withdraw");
      const { taskStateInfoAddress, submitterKeypair } = await takeInputForWithdraw();
      if (ISKPLTask === "yes") {
        await KPLWithdraw(payerWallet as unknown as SolanaKeypair, taskStateInfoAddress as unknown as SolanaPublicKey, submitterKeypair as unknown as SolanaKeypair);
      }else{
        await Withdraw(payerWallet, taskStateInfoAddress, submitterKeypair);
      }
      break;
    }
    case "handle-assets": {
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      await handleMetadata();
      break;
    }
    case "update-task": {
      await checkIsKPLTask();
      const result = await initializeConnection(walletPath);
      walletPath = result.walletPath;
      const { payerWallet, connection } = result;
      const taskMode = (
        await prompts({
          type: "select",
          name: "mode",
          message: "Select operation",

          choices: [
            { title: "using config YML", value: "yml" },
            { title: "using CLI", value: "cli" },
          ],
        })
      ).mode;
      console.log(taskMode);

      switch (taskMode) {
        case "cli": {
          let taskId = (
            await prompts({
              type: "text",
              name: "taskId",
              message: "Enter id of the task you want to edit",
            })
          ).taskId;
          taskId = sanitizePath(taskId);
          const accountInfo = await connection.getAccountInfo(
            new PublicKey(taskId)
          );
          if (accountInfo == null) {
            console.log("No task found with this Id");
            break;
          }
          const rawData = accountInfo.data + "";
          const state = JSON.parse(rawData);
          console.log(state);
          if (
            new PublicKey(state.task_manager).toString() !==
            payerWallet.publicKey.toString()
          ) {
            console.log("You are not the owner of this task! ");
            break;
          }
          const taskAccountInfoPubKey = new PublicKey(taskId);
          console.log("OLD TASK STATE INFO", taskAccountInfoPubKey);
          const statePotAccount = new PublicKey(state.stake_pot_account);
          console.log("OLD STATE POT", statePotAccount);
          const {
            task_name,
            task_audit_program_id,
            bounty_amount_per_round,
            space,
            task_description,
            task_executable_network,
            round_time,
            audit_window,
            submission_window,
            minimum_stake_amount,
            task_metadata,
            allowed_failed_distributions,
          } = await takeInputForCreateTask(false, state);
          // const [task_name, task_audit_program, total_bounty_amount, bounty_amount_per_round, space] =["Test Task","test audit",100,10,10]
          const minimumBalanceForRentExemption =
            (await connection.getMinimumBalanceForRentExemption(
              space * 1000000
            )) + 10000;
          const totalAmount = minimumBalanceForRentExemption;
          const response = (
            await prompts({
              type: "confirm",
              name: "response",
              message: `Your account will be deducted ${
                totalAmount / LAMPORTS_PER_SOL
              } KOII for creating the task, which includes the rent exemption (${
                minimumBalanceForRentExemption / LAMPORTS_PER_SOL
              } KOII) and bounty amount fees is taken from the last task`,
            })
          ).response;

          if (!response) process.exit(0);
          const lamports = await connection.getBalance(payerWallet.publicKey);
          if (lamports < totalAmount) {
            console.error("Insufficient balance for this operation");
            process.exit(0);
          }
          console.log("Calling Update Task");

  
            const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
            await updateTask(
              payerWallet,
              task_name,
              task_audit_program_id,
              bounty_amount_per_round,
              space * 1000000,
              task_description,
              task_executable_network,
              round_time,
              audit_window,
              submission_window,
              minimum_stake_amount,
              task_metadata,
              "",
              allowed_failed_distributions,
              taskAccountInfoPubKey,
              statePotAccount
            );
                      fs.writeFileSync(
            "taskStateInfoKeypair.json",
            JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey))
          );
          console.log("Task Id:", newTaskStateInfoKeypair.publicKey.toBase58());
          console.log(
            "Stake Pot Account Pubkey:",
            newStake_pot_account_pubkey.toBase58()
          );
          console.log(
            "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
          );
 
  
          break;
        }

        case "yml": {
          let metaDataCid: string;
          let task_audit_program_id_update: string;
          let stakingWalletKeypair: Keypair;

          const currentDir = path.resolve(process.cwd());
          let ymlPath = `${currentDir}/config-task.yml`;

          if (!fs.existsSync(ymlPath)) {
            ymlPath = (
              await prompts({
                type: "text",
                name: "ymlPath",
                message: "Enter the path to your config-task.yml file",
              })
            ).ymlPath;
            ymlPath = sanitizePath(ymlPath);
            if (
              !fs.existsSync(ymlPath) ||
              (!ymlPath.includes(".yml") && !ymlPath.includes(".yaml"))
            ) {
              throw Error(
                "Please make sure that the path to your config-task.yml file is correct."
              );
            }
          }

          await readYamlFile(ymlPath).then(async (data: any) => {
            //console.log("CHECK", data.task_executable_network);

            //console.log("TN", task_executable_network);

            const metaData: TaskMetadata = {
              author: data.author.trim(),
              description: data.description.trim(),
              repositoryUrl: data.repositoryUrl,
              createdAt: Date.now(),
              migrationDescription: data.migrationDescription,
              imageUrl: data.imageUrl,
              requirementsTags: data.requirementsTags,
            };
            fs.writeFileSync("./metadata.json", JSON.stringify(metaData));

            if (data.task_executable_network == "IPFS") {
              const ipfsMode = (
                await prompts({
                  type: "select",
                  name: "mode",
                  message: "Select operation",

                  choices: [
                    { title: "Manually Input IPFS", value: "manual" },
                    { title: "Using KOII Storage SDK", value: "koii-storage" },
                  ],
                })
              ).mode;
              if (ipfsMode == "manual") {
                const ipfsCid = (
                  await prompts({
                    type: "text",
                    name: "ipfsCid",
                    message: "Enter the IPFS CID",
                  })
                ).ipfsCid.trim();
                task_audit_program_id_update = ipfsCid;
                const ipfsData = (
                  await prompts({
                    type: "text",
                    name: "metadataCid",
                    message: "Enter the Metadata CID",
                  })
                ).metadataCid.trim();
                metaDataCid = ipfsData || "";
              } else {
                const storageClient = new KoiiStorageClient(
                  undefined,
                  undefined,
                  false
                );

                // ask user to enter the stakingWallet Keypair path
                let stakingWalletPath = (
                  await prompts({
                    type: "text",
                    name: "stakingWalletPath",
                    message: "Enter the path to your staking wallet",
                  })
                ).stakingWalletPath;
                stakingWalletPath = sanitizePath(stakingWalletPath);
                if (!fs.existsSync(stakingWalletPath)) {
                  throw Error(
                    "Please make sure that the staking wallet path is correct"
                  );
                }
                const wallet = fs.readFileSync(stakingWalletPath, "utf-8");
                stakingWalletKeypair = Keypair.fromSecretKey(
                  Uint8Array.from(JSON.parse(wallet))
                );

                // Upload a file
                const upload = await storageClient.uploadFile(
                  data.task_audit_program,
                  stakingWalletKeypair
                );
                task_audit_program_id_update = upload.cid;
                console.log("TASK CID", task_audit_program_id_update);

                // Upload a metadata.json file
                try {
                  const ipfsData = await storageClient.uploadFile(
                    "./metadata.json",
                    stakingWalletKeypair
                  );
                  metaDataCid = ipfsData.cid || "";
                } catch (err) {
                  console.error("IPFS upload faileds");
                  process.exit();
                }
                console.log(
                  "\x1b[1m\x1b[32m%s\x1b[0m",
                  `Your MetaData CID is ${metaDataCid}/metadata.json`
                );
              }
            } else if (
              data.task_executable_network == "ARWEAVE" ||
              data.task_executable_network == "DEVELOPMENT"
            ) {
              task_audit_program_id_update = data.task_audit_program;
              metaDataCid = "metadata.json";
              process.exit();
            }

            const TaskData: UpdateTask = {
              task_id: data.task_id,
              task_name: data.task_name.trim(),
              task_executable_network: data.task_executable_network,
              secret_web3_storage_key: data.secret_web3_storage_key,
              task_audit_program: data.task_audit_program,
              task_audit_program_id: task_audit_program_id_update,
              round_time: data.round_time,
              audit_window: data.audit_window,
              submission_window: data.submission_window,
              minimum_stake_amount: data.minimum_stake_amount,
              bounty_amount_per_round: data.bounty_amount_per_round,
              allowed_failed_distributions: data.allowed_failed_distributions,
              space: data.space,
            };

            console.log("TASK DATA", TaskData);
            console.log("Metadata", metaData);

            await validateUpdateTaskInputs(metaData, TaskData);
            console.log("Task id", TaskData.task_id);
            const accountInfo = await connection.getAccountInfo(
              new PublicKey(TaskData.task_id)
            );

            // Add this in validation

            if (accountInfo == null) {
              console.error("No task found with this Id");
              process.exit();
            }
     
            const rawData: any = accountInfo.data + "";
            console.log(rawData);
            let state;
            if(ISKPLTask === "yes"){
              state = JSON.parse(rawData.slice(4));
            }else{
              state = JSON.parse(rawData);
            }
            
            //console.log(state);
            if (
              new PublicKey(state.task_manager).toString() !==
              payerWallet.publicKey.toString()
            ) {
              console.error("You are not the owner of this task! ");
              process.exit();
            }
            const taskAccountInfoPubKey = new PublicKey(TaskData.task_id);
            //console.log("OLD TASK STATE INFO", taskAccountInfoPubKey);
            const statePotAccount = new PublicKey(state.stake_pot_account);
            //console.log("OLD STATE POT", statePotAccount);

            const minimumBalanceForRentExemption =
              (await connection.getMinimumBalanceForRentExemption(
                TaskData.space * 1000000
              )) + 10000;
            const totalAmount = minimumBalanceForRentExemption;
            const response = (
              await prompts({
                type: "confirm",
                name: "response",
                message: `Your account will be deducted ${
                  totalAmount / LAMPORTS_PER_SOL
                } KOII for creating the task, which includes the rent exemption (${
                  minimumBalanceForRentExemption / LAMPORTS_PER_SOL
                } KOII) and bounty amount fees is taken from the last task`,
              })
            ).response;

            if (!response) process.exit(0);
            const lamports = await connection.getBalance(payerWallet.publicKey);
            if (lamports < totalAmount) {
              console.error("Insufficient balance for this operation");
              process.exit(0);
            }
            console.log("Calling Update Task");
            if (ISKPLTask === "yes") {
              const mint_address = (
                await prompts({
                  type: "text",
                  name: "mint_address",
                  message: "Enter the mint address of the token you want to use for the task",
                })
              ).mint_address.trim();
              
              const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
              await KPLUpdateTask(
                payerWallet as unknown as SolanaKeypair,
                TaskData.task_name,
                task_audit_program_id_update,
                TaskData.bounty_amount_per_round,
                TaskData.space * 1000000,
                data?.description?.substring(0, 50),
                TaskData.task_executable_network,
                TaskData.round_time,
                TaskData.audit_window,
                TaskData.submission_window,
                TaskData.minimum_stake_amount,
                metaDataCid,
                "",
                TaskData.allowed_failed_distributions,
                taskAccountInfoPubKey as unknown as SolanaPublicKey,
                statePotAccount as unknown as SolanaPublicKey,
                mint_address
              );
            fs.writeFileSync(
              "taskStateInfoKeypair.json",
              JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey))
            );
            if (data.task_executable_network == "DEVELOPMENT") {
              fs.renameSync(
                "metadata.json",
                `dist/${newTaskStateInfoKeypair.publicKey.toBase58()}.json`
              );
            }
            console.log(
              "Task Id:",
              newTaskStateInfoKeypair.publicKey.toBase58()
            );
            console.log(
              "Stake Pot Account Pubkey:",
              newStake_pot_account_pubkey.toBase58()
            );
            console.log(
              "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
            );
            }
            else{
            const { newTaskStateInfoKeypair, newStake_pot_account_pubkey } =
              await updateTask(
                payerWallet,
                TaskData.task_name,
                task_audit_program_id_update,
                TaskData.bounty_amount_per_round,
                TaskData.space * 1000000,
                data?.description?.substring(0, 50),
                TaskData.task_executable_network,
                TaskData.round_time,
                TaskData.audit_window,
                TaskData.submission_window,
                TaskData.minimum_stake_amount,
                metaDataCid,
                "",
                TaskData.allowed_failed_distributions,
                taskAccountInfoPubKey,
                statePotAccount
              );
            fs.writeFileSync(
              "taskStateInfoKeypair.json",
              JSON.stringify(Array.from(newTaskStateInfoKeypair.secretKey))
            );
            if (data.task_executable_network == "DEVELOPMENT") {
              fs.renameSync(
                "metadata.json",
                `dist/${newTaskStateInfoKeypair.publicKey.toBase58()}.json`
              );
            }
            console.log(
              "Task Id:",
              newTaskStateInfoKeypair.publicKey.toBase58()
            );
            console.log(
              "Stake Pot Account Pubkey:",
              newStake_pot_account_pubkey.toBase58()
            );
            console.log(
              "Note: Task Id is basically the public key of taskStateInfoKeypair.json"
            );
          }
          });
          break;
        }
      }
      break;
    }

    default:
      console.error("Invalid option selected");
  }
  console.log("Success");
}

async function takeInputForCreateTask(isBounty: boolean, state?: any) {
  let task_name = (
    await prompts({
      type: "text",
      name: "task_name",
      message: "Enter the name of the task",
    })
  ).task_name.trim();
  while (task_name.length > 24) {
    console.error("The task name cannot be greater than 24 characters");
    task_name = (
      await prompts({
        type: "text",
        name: "task_name",
        message: "Enter the name of the task",
        initial: state?.name || null,
      })
    ).task_name.trim();
  }
  const task_description = (
    await prompts({
      type: "text",
      name: "task_description",
      message: "Enter a short description of your task",
    })
  ).task_description.trim();

  const task_executable_network = (
    await prompts({
      type: "select",
      name: "task_executable_network",
      message: "Please select the type of network",
      choices: [
        {
          title: "DEVELOPMENT",
          value: "DEVELOPMENT",
        },
        {
          title: "IPFS",
          value: "IPFS",
        },
        {
          title: "ARWEAVE",
          value: "ARWEAVE",
        },
      ],
    })
  ).task_executable_network;

  let stakingWalletKeypair;
  let task_audit_program;
  let task_audit_program_id;
  if (task_executable_network == "IPFS") {
    let stakingWalletPath = (
      await prompts({
        type: "text",
        name: "stakingWalletPath",
        message: "Enter the path to your staking wallet",
      })
    ).stakingWalletPath;
    stakingWalletPath = sanitizePath(stakingWalletPath);
    if (!fs.existsSync(stakingWalletPath)) {
      throw Error("Please make sure that the staking wallet path is correct");
    }
    const wallet = fs.readFileSync(stakingWalletPath, "utf-8");
    stakingWalletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(wallet))
    );

    task_audit_program = (
      await prompts({
        type: "text",
        name: "task_audit_program",
        message: "Enter the path to your executable webpack",
      })
    ).task_audit_program.trim();
 
    while (task_audit_program.length > 200) {
      console.error(
        "The task audit program length cannot be greater than 200 characters"
      );
      task_audit_program = (
        await prompts({
          type: "text",
          name: "task_audit_program",
          message: "Enter the path to your executable webpack",
        })
      ).task_audit_program.trim();
    }
    task_audit_program_id = await uploadExecutableFileToIpfs(
      task_audit_program,
      stakingWalletKeypair
    );
    //console.log("CID OUTSIDE LOOP", cid);
    while (task_audit_program_id == "File not found") {
      task_audit_program = (
        await prompts({
          type: "text",
          name: "task_audit_program",
          message: "Enter the path to your executable webpack",
        })
      ).task_audit_program.trim();
      task_audit_program_id = await uploadExecutableFileToIpfs(
        task_audit_program,
        stakingWalletKeypair
      );
      //console.log("CID VALUE",task_audit_program_id);
    }
  } else if (task_executable_network == "ARWEAVE") {
    task_audit_program_id = (
      await prompts({
        type: "text",
        name: "task_audit_program_id",
        message:
          "Enter Arweave id of the deployed koii task executable program",
      })
    ).task_audit_program_id.trim();
    while (task_audit_program_id.length > 64) {
      console.error(
        "The task audit program length cannot be greater than 64 characters"
      );
      task_audit_program_id = (
        await prompts({
          type: "text",
          name: "task_audit_program_id",
          message:
            "Enter Arweave id of the deployed koii task executable program",
        })
      ).task_audit_program_id.trim();
    }
  } else {
    task_audit_program_id = (
      await prompts({
        type: "text",
        name: "task_audit_program_id",
        message: "Enter the name of executable you want to run on  task-nodes",
      })
    ).task_audit_program_id.trim();
    while (task_audit_program_id.length > 64) {
      console.error(
        "The task audit program length cannot be greater than 64 characters"
      );
      task_audit_program_id = (
        await prompts({
          type: "text",
          name: "task_audit_program_id",
          message:
            "Enter the name of executable you want to run on  task-nodes",
        })
      ).task_audit_program_id.trim();
    }
  }
  const round_time = (
    await prompts({
      type: "number",
      name: "round_time",
      message: "Enter the round time in slots",
    })
  ).round_time;
  const audit_window = (
    await prompts({
      type: "number",
      name: "audit_window",
      message: "Enter the audit window in slots",
    })
  ).audit_window;
  const submission_window = (
    await prompts({
      type: "number",
      name: "submission_window",
      message: "Enter the submission window in slots",
    })
  ).submission_window;
  const minimum_stake_amount = (
    await prompts({
      type: "number",
      name: "minimum_stake_amount",
      message: "Enter the minimum staking amount for the task (in KOII)",
      float: true,
    })
  ).minimum_stake_amount;
  let total_bounty_amount;

  if (isBounty) {
    total_bounty_amount = (
      await prompts({
        type: "number",
        name: "total_bounty_amount",
        message:
          "Enter the total bounty you want to allocate for the task (In KOII)",
      })
    ).total_bounty_amount;
    while (total_bounty_amount < 10) {
      console.error("The total_bounty_amount cannot be less than 10");
      total_bounty_amount = (
        await prompts({
          type: "number",
          name: "total_bounty_amount",
          message:
            "Enter the total bounty you want to allocate for the task (In KOII)",
        })
      ).total_bounty_amount;
    }
  }
  let bounty_amount_per_round = (
    await prompts({
      type: "number",
      name: "bounty_amount_per_round",
      message: "Enter the bounty amount per round (In KOII)",
      // max: total_bounty_amount,
    })
  ).bounty_amount_per_round;
  let allowed_failed_distributions = (
    await prompts({
      type: "number",
      name: "allowed_failed_distributions",
      message:
        "Enter the number of distribution list submission retry in case it fails",
    })
  ).allowed_failed_distributions;
  while (allowed_failed_distributions < 0) {
    console.error("failed distributions cannot be less than 0");
    allowed_failed_distributions = (
      await prompts({
        type: "number",
        name: "allowed_failed_distributions",
        message:
          "Enter the number of distribution list submission retry in case it fails",
      })
    ).allowed_failed_distributions;
  }

  const task_metadata = (
    await prompts({
      type: "text",
      name: "task_metadata",
      message: `Enter TaskMetadata CID hosted on ${"IPFS"} (Leave empty for None).`,
    })
  ).task_metadata.trim();
  if (isBounty) {
    while (bounty_amount_per_round > total_bounty_amount) {
      console.error(
        "The bounty_amount_per_round cannot be greater than total_bounty_amount"
      );
      bounty_amount_per_round = (
        await prompts({
          type: "number",
          name: "bounty_amount_per_round",
          message: "Enter the bounty amount per round",
        })
      ).bounty_amount_per_round;
    }
  }

  let space = (
    await prompts({
      type: "number",
      name: "space",
      message:
        "Enter the space, you want to allocate for task account (in MBs)",
    })
  ).space;
  while (space < 1) {
    console.error("Space cannot be less than 1 mb");
    space = (
      await prompts({
        type: "number",
        name: "space",
        message:
          "Enter the space, you want to allocate for task account (in MBs)",
      })
    ).space;
  }

  return {
    task_name,
    task_audit_program_id,
    total_bounty_amount,
    bounty_amount_per_round,
    space,
    task_description,
    task_executable_network,
    round_time,
    audit_window,
    submission_window,
    minimum_stake_amount,
    task_metadata,
    allowed_failed_distributions,
  };
}

async function takeInputForSetActive() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress.trim();
  const isActive = (
    await prompts({
      type: "select",
      name: "isActive",
      message: "Do you want to set the task to Active or Inactive?",
      choices: [
        {
          title: "Active",
          description: "Set the task active",
          value: "Active",
        },
        {
          title: "Inactive",
          description: "Deactivate the task",
          value: "Inactive",
        },
      ],
    })
  ).isActive;
  return {
    isActive: isActive == "Active",
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}

async function takeInputForClaimReward() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress.trim();
  const beneficiaryAccount = (
    await prompts({
      type: "text",
      name: "beneficiaryAccount",
      message:
        "Enter the beneficiaryAccount address (Address that the funds will be transferred to)",
    })
  ).beneficiaryAccount.trim();
  let claimerKeypair = (
    await prompts({
      type: "text",
      name: "claimerKeypair",
      message: "Enter the path to Claimer wallet",
    })
  ).claimerKeypair;
  claimerKeypair = sanitizePath(claimerKeypair);
  return {
    claimerKeypair,
    beneficiaryAccount: new PublicKey(beneficiaryAccount),
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForFundTask() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress.trim();
  const amount = (
    await prompts({
      type: "text",
      name: "amount",
      message: "Enter the amount(in KOII) to fund",
    })
  ).amount.trim();
  return {
    amount: amount,
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
  };
}
async function takeInputForWithdraw() {
  const taskStateInfoAddress = (
    await prompts({
      type: "text",
      name: "taskStateInfoAddress",
      message: "Enter the task id",
    })
  ).taskStateInfoAddress.trim();
  let submitterWalletPath = (
    await prompts({
      type: "text",
      name: "submitterWalletPath",
      message: "Enter the submitter wallet path address",
    })
  ).submitterWalletPath;
  submitterWalletPath = sanitizePath(submitterWalletPath);
  const wallet = fs.readFileSync(submitterWalletPath, "utf-8");
  const submitterKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(wallet))
  );
  return {
    taskStateInfoAddress: new PublicKey(taskStateInfoAddress),
    submitterKeypair,
  };
}
main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getWalletPathFromDesktopNode(type: string) {
  try {
    let desktopNodeFolderLocation = getKoiiDesktopNodePath();
    if (type == "StakingWallet") {
      desktopNodeFolderLocation = path.join(
        desktopNodeFolderLocation,
        "namespace"
      );
      const files = fs.readdirSync(desktopNodeFolderLocation);
      if (!files || files.length == 0) {
        return null;
      }
      const stakingWalletPath = files.find((e) =>
        e.includes("stakingWallet.json")
      );
      return path.join(desktopNodeFolderLocation, stakingWalletPath || "");
    } else if (type == "MainWallet") {
      desktopNodeFolderLocation = path.join(
        desktopNodeFolderLocation,
        "wallets"
      );
    } else {
      throw new Error("INVALID TYPE");
    }
    const files = fs.readdirSync(desktopNodeFolderLocation);
    if (!files || files.length == 0) {
      return null;
    }
    const mainSystemWallet = files.find((e) =>
      e.includes("mainSystemWallet.json")
    );
    return path.join(desktopNodeFolderLocation, mainSystemWallet || "");
  } catch (error) {
    console.error(error);
    return null;
  }
}

function getKoiiDesktopNodePath() {
  let basePath;

  switch (process.platform) {
    case "darwin": // MacOS
      basePath = path.join(
        process.env.HOME || "",
        "Library",
        "Application Support",
        "KOII-Desktop-Node"
      );
      break;
    case "win32": // Windows
      basePath = path.join(process.env.APPDATA || "", "KOII-Desktop-Node");
      break;
    case "linux": // Linux
      basePath = path.join(
        process.env.HOME || "",
        ".config",
        "KOII-Desktop-Node"
      );
      break;
    default:
      throw new Error("Unsupported operating system");
  }

  return basePath;
}
