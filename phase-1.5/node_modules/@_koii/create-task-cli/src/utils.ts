/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import os from "os";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import { Keypair } from "@_koii/web3.js";
import {KoiiStorageClient} from '@_koii/storage-task-sdk';
import * as dotenv from "dotenv";
dotenv.config();


/**
 * @private
 */
export async function getConfig(): Promise<any> {
  // Path to KOII CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    ".config",
    "koii",
    "cli",
    "config.yml"
  );

  const configYml = fs.readFileSync(CONFIG_FILE_PATH, { encoding: "utf8" });

  return yaml.parse(configYml);
}

/**
 * Load and parse the Koii CLI config file to determine which RPC url to use
 */
export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    console.log("CONFIG", config);
    if (!config.json_rpc_url) throw new Error("Missing RPC URL");
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      "Failed to read RPC url from CLI config file, falling back to testnet"
    );
    return "https://testnet.koii.network/";
  }
}

/**
 * Load and parse the KOII CLI config file to determine which payer to use
 */
export async function getPayer(): Promise<Keypair> {
  try {
    const config = await getConfig();
    if (!config.keypair_path) throw new Error("Missing keypair path");
    return await createKeypairFromFile(config.keypair_path);
  } catch (err) {
    console.warn(
      "Failed to create keypair from CLI config file, falling back to new random keypair"
    );
    return Keypair.generate();
  }
}

/**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
export async function createKeypairFromFile(
  filePath: string
): Promise<Keypair> {
  const secretKeyString = fs.readFileSync(filePath, { encoding: "utf8" });
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export async function uploadExecutableFileToIpfs(
  filePath: string,
  stakingWalletKeypair: Keypair
): Promise<string> {
  const path = `${filePath}`;
  //console.log(filePath);
  //console.log(secret_web3_storage_key);
  console.log("FILEPATH", path);
  if (path.substring(path.length - 7) !== "main.js") {
    console.error("Provide a valid path to webpacked 'main.js' file");
    process.exit();
  }
  if (fs.existsSync(path)) {
    // const storageClient = new Web3Storage({
    //   token: secret_web3_storage_key || "",
    // });
    const storageClient = new KoiiStorageClient(undefined,undefined,true);

    let cid: any;

    if (storageClient) {
      // const upload: any = await getFilesFromPath(path);
      // cid = await storageClient.put(upload);
      const ipfsData = await storageClient.uploadFile(
        filePath,
        stakingWalletKeypair
      )
      cid = ipfsData.cid;
    }
    console.log("CID of executable", cid);
    return cid;
  } else {
    console.error("\x1b[31m%s\x1b[0m", "task_audit_program File not found");
    process.exit();
  }
}
