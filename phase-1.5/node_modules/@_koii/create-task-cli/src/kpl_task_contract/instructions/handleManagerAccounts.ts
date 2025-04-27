import { PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { struct, u8, blob } from '@solana/buffer-layout';
import { TaskInstruction } from "./instruction";
import { padStringWithSpaces } from "../util";

interface Data {
    instruction: number,
    operation_vec: Uint8Array
}

const DataLayout = struct<Data>([
    u8('instruction'),
    blob(24, 'operation_vec'),
]);


interface HandleManagerAccountsParams {
    operation: "init" | "insert" | "remove",
}

interface AccountsParams {
    ownerAccount?: PublicKey,
    signer_1?: PublicKey,
    signer_2?: PublicKey,
    targetManager?: PublicKey,
}

export async function handleManagerAccountsInstruction(params: HandleManagerAccountsParams, accounts:AccountsParams, programId: PublicKey): Promise<TransactionInstruction> {
    const data = Buffer.alloc(DataLayout.span);
    DataLayout.encode(
        {
            instruction: TaskInstruction.HandleManagerAccountsInstruction,
            operation_vec: new TextEncoder().encode(padStringWithSpaces(params.operation, 24)),
        },
        data
    );
    let [managerAccountDataHolder, _bump] = await PublicKey.findProgramAddress(
        [Buffer.from("manager")],
        programId,
    );

    let keys = [
        {pubkey: managerAccountDataHolder, isSigner: false, isWritable: true},
    ];
    console.log(managerAccountDataHolder.toBase58())
    if (params.operation == "init") {
        if (!accounts.ownerAccount) {
            console.error("Owner Account required for init operation");
            process.exit();
        }
        let SYSVAR_PUB = new PublicKey("11111111111111111111111111111111");

        keys = keys.concat([
            {pubkey: accounts.ownerAccount, isSigner: true, isWritable: true},
            {pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            {pubkey: SYSVAR_PUB, isSigner: false, isWritable: false},
        ])
    } else if(params.operation == "insert") {
        if (!accounts.signer_1 || !accounts.signer_2 || !accounts.targetManager ) {
            console.error("Owner Account required for init operation");
            process.exit();
        }

        keys = keys.concat([
            {pubkey: accounts.signer_1, isSigner: true, isWritable: true},
            {pubkey: accounts.signer_2, isSigner: true, isWritable: true},
            {pubkey: accounts.targetManager, isSigner: false, isWritable: true},
        ])
    } else if(params.operation == "remove") {
        if (!accounts.signer_1 || !accounts.signer_2 || !accounts.targetManager ) {
            console.error("Owner Account required for init operation");
            process.exit();
        }

        keys = keys.concat([
            {pubkey: accounts.signer_1, isSigner: true, isWritable: true},
            {pubkey: accounts.signer_2, isSigner: true, isWritable: true},
            {pubkey: accounts.targetManager, isSigner: false, isWritable: true},
        ])
    }

    return new TransactionInstruction({
        keys,
        programId: programId,
        data,
    });
}