# Directive Embedding for AI Agents

This document explains how AI agents should utilize directives when working with this repository, without modifying the existing `.kno` embedding structure.

## Approach for AI Agents

AI agents working with this repository should:

1. **Prioritize directive reading** at the beginning of each session
2. **Maintain directive awareness** throughout the interaction
3. **Validate work** against directive requirements

## Utilizing Existing .kno Structure

The repository already includes a basic `.kno` structure. AI agents should:

1. **Read this structure** to understand the repository organization
2. **Reference but not modify** the existing embeddings
3. **Respect the project organization** reflected in these embeddings

## Directive Priority Order

When processing directives, AI agents should prioritize them in this order:

1. `prevent_hallucinations.md` - Critical for avoiding plan deviations
2. `run_until_working.md` - Ensures functional implementations
3. `time_bounded_testing.md` - Maintains efficient testing processes
4. `start_next_phase.md` - Guides phase transitions

## Implementation Guidelines

For optimal performance when incorporating directives:

1. **Read directives first** before exploring code
2. **Create temporary in-memory embeddings** of directive content if needed
3. **Reference specific directive sections** when explaining decisions
4. **Do not modify** repository structure or embedding files
5. **Alert users** when a request conflicts with directives

## Connecting Directives to Code

When working with code, AI agents should:

1. **Map directive requirements** to code components
2. **Include directive references** in code comments when appropriate
3. **Document alignment** between implementations and directive requirements
4. **Suggest plan_update.md creation** when implementation needs to deviate from plans

## Example Directive Citation Format

When referencing directives in explanations:

```
As per <directive-name> section "<section-title>", this implementation:
- <implementation aspect that fulfills the directive>
- <another implementation aspect>

This ensures compliance with the core principle that "<quote from directive>"
```

Following these guidelines ensures AI agents incorporate directive knowledge appropriately without modifying the existing embedding structure.