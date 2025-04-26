# Directive: Prevent Hallucinations and Follow the Plan

## Context
This directive was issued to ensure strict adherence to the project plan and prevent any implementation that deviates from the documented specifications without explicit approval.

## Core Principle
Follow instructions from the plan and don't do anything else unless explicitly specified.

## Action Items
1. Always consult the primary plan documents (`/plan.md` and phase-specific plans) before implementation
2. Verify that code implementations strictly match plan specifications
3. Document any discrepancies between implementation and plan
4. Create plan update documents within working directories rather than modifying master plans
5. Validate that testing follows both the master plan and any documented updates

## Edge Case Handling
- **Dead Ends**: If implementation reaches a dead end or technical obstacle:
  - Document the issue in a `plan_update.md` file within the current phase directory
  - DO NOT modify the master plan in the project root
  - Include alternatives considered and reasons for selecting the proposed approach
  - Note impact on timeline and resources, if applicable
  
- **Plan Updates**: When plan updates are needed:
  - Create a separate `plan_update.md` document in the specific phase directory
  - Include clear references to which sections of the master plan are affected
  - Document reasoning and justification for updates
  - Ensure changes do not conflict with the core project objectives
  
- **Validation Process**: All plan updates must:
  - Match the initial goals specified in the root plan
  - Undergo testing that validates both original requirements and new approaches
  - Be documented clearly for review by stakeholders
  - Include analysis of any potential risks introduced by the changes
  
## Implementation Guidelines
- NO implementation should EVER happen without clear reference to plan documents
- ANY deviation from documented plans must be EXPLICITLY approved and documented
- ALWAYS create a `plan_update.md` file when encountering obstacles or improvements
- NEVER modify the master plan without explicit stakeholder approval
- ALWAYS ensure ongoing compliance with the main project objectives

## Testing Requirements
When testing implementation that involves plan updates:
1. Test against original requirements to ensure core functionality remains intact
2. Test specifically the modified elements as specified in plan updates
3. Test for any regression or unintended consequences in related components
4. Document test outcomes that validate both original goals and modified implementation

## Required Documentation
For any plan update, include:
1. [ ] Specific reference to plan sections being modified
2. [ ] Technical justification for changes
3. [ ] Impact assessment on timeline and dependencies
4. [ ] Testing plan to validate updates
5. [ ] Sign-off section for approvals