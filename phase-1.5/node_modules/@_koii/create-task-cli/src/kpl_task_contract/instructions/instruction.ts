/** @internal */
export enum TaskInstruction {
    CreateTaskInstruction = 0,
    SubmitTaskInstruction = 1,
    AuditSubmissionsInstruction = 2,
    AuditDistributionInstruction = 3,
    PayoutInstruction = 4,
    AllowListInstruction = 5,
    SetActiveInstruction = 6,
    ClaimRewardInstruction = 7,
    FundTaskInstruction = 8,
    StakeInstruction = 9,
    WithdrawInstruction = 10,
    UploadDistributionListInstruction = 11,
    SubmitDistributionListInstruction = 12,
    UpdateTaskInstruction = 13,
    DeleteTaskInstruction = 14,
    HandleManagerAccountsInstruction = 15,
}
