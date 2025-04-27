import path from 'path';
import yaml from 'yaml';
import os from 'os';
import fs from 'mz/fs';
import {Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY} from '@solana/web3.js';
import { Connection } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
async function getConfig(): Promise<any> {
    const CONFIG_FILE_PATH = path.resolve(
      os.homedir(),
      '.config',
      'koii',
      'cli',
      'config.yml',
    );
    const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
    return yaml.parse(configYml);
  }
  
  /**
   * Load and parse the Koii CLI config file to determine which RPC url to use
   */
  export async function getRpcUrl(): Promise<string> {
    try {
      const config = await getConfig();
      if (!config.json_rpc_url) throw new Error('Missing RPC URL');
      return config.json_rpc_url;
    } catch (err) {
      console.warn(
        'Failed to read RPC url from CLI config file, falling back to localhost',
      );
      return 'http://127.0.0.1:8899';
    }
  }

/**
 * Load and parse the Koii CLI config file to determine which payer to use
 */
export async function getPayer(): Promise<Keypair> {
    try {
        const config = await getConfig();
        if (!config.keypair_path) throw new Error('Missing keypair path');
        return await createKeypairFromFile(config.keypair_path);
    } catch (err) {
        console.warn('Failed to create keypair from CLI config file, falling back to new random keypair',);
      return Keypair.generate();
    }
  }

  /**
 * Create a Keypair from a secret key stored in file as bytes' array
 */
export async function createKeypairFromFile(
    filePath: string,
): Promise<Keypair> {
    const secretKeyString = await fs.readFile(filePath, {encoding: 'utf8'});
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
}

function getAlloc(type: any, fields: any) {
  let alloc = 0;
  type.layout.fields.forEach((item: any) => {
    if (item.span >= 0) {
      alloc += item.span;
    } else if (typeof item.alloc === 'function') {
      alloc += item.alloc(fields[item.property]);
    }
  });
  return alloc;
}

export function encodeData(type: any, fields: any) {
  const allocLength = type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
  const data = Buffer.alloc(allocLength);
  const layoutFields = Object.assign({instruction: type.index}, fields);
  type.layout.encode(layoutFields, data);
  return data;
}


export function padStringWithSpaces(input: string, length: number) {
  if (input.length > length) throw Error('Input exceeds the maxiumum length of ' + length);
  input = input.padEnd(length);
  return input;
}

export async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



export async function getKPLDigits(mint_address: string, connection: Connection) {
  const mint = new PublicKey(mint_address);
  const mintInfo = await getMint(connection, mint);
  const decimals = mintInfo.decimals;
  return decimals;
}

