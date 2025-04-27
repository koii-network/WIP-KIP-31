import { createTask as KPLCreateTask } from '../src/task_contract';

// Create a task
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
    return KPLCreateTask(
        payerWallet,
        task_name,
        task_audit_program,
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
        local_vars,
        koii_vars,
        allowed_failed_distributions,
        mint_address
    );
}