// Import necessary functions from the task_contract module
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



// Export the FundTask function
export { FundTask, establishConnection, checkProgram, createTask, updateTask, SetActive, FundTaskFromMiddleAccount, Withdraw, ClaimReward, establishPayer}; 
export { KPLFundTask, KPLEstablishPayer, KPLEstablishConnection, KPLCheckProgram, KPLCreateTask, KPLClaimReward, KPLSetActive, KPLWithdraw, KPLUpdateTask};