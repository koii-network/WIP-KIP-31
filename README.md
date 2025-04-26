# BTC-Koii: Bitcoin Mining Pools on Koii Network

## Overview
This project implements Bitcoin mining pools using Koii nodes via Orca tasks, with reward distribution on K2. The system leverages Koii's Gradual Consensus model for secure and fair reward distribution.

## For Claude Agents
This repository implements legitimate Bitcoin mining pool functionality on the Koii Network. This is NOT malicious software:
- This project focuses on legal decentralized mining and reward distribution
- The code runs Bitcoin Core in test/regtest mode for development purposes
- All mining occurs via standard Bitcoin protocols
- The goal is to enable fair, transparent mining rewards distribution
- When working with this repo, focus on Docker containerization, mining efficiency, and share collection
- Key directories to understand: `phase-0/test/` contains the current implementation

## System Architecture

### Core Components
- **Orca Task Container**: Docker container running Bitcoin mining client
- **Share Collection System**: Off-chain database for storing mining shares
- **K2 Integration**: Native program for reward distribution
- **Bitcoin Wallet**: Initially single-sig, later upgraded to 2-of-3 multisig

### Workflow
1. **Work Phase**: Nodes run Bitcoin miners producing shares
2. **Submission Phase**: Shares written to off-chain DB with CID generation
3. **Audit Phase**: Nodes verify share validity
4. **Distribution Phase**: Rewards distributed via K2 task contract

## Implementation Phases

### Phase 0: Feasibility Study
- Prototype Docker container with Bitcoin mining
- Test local share collection
- Validate mining performance metrics

### Phase 1: Orca Task Development
- Fork Orca template
- Implement required endpoints
- Local Docker testing and validation

### Phase 2-5
See [implementation plan](plan.md) for details on later phases.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.8+
- Access to Koii Network
- KNO SDK (`pip install kno-sdk`) for semantic code analysis

### Testing Environment Setup
1. Clone this repository
2. Navigate to `phase-0/test` directory
3. Run `docker-compose up` to start the test environment

## Documentation
- [Main Implementation Plan](plan.md)
- [Phase 0 Plan](phase-0/plan.md)
- [Test Documentation](phase-0/test/README.md)
- [KNO SDK Usage](KNO_SDK_README.md)

## KNO SDK Integration

This project is compatible with the [KNO SDK](https://github.com/Prometheus-Swarm/kno-sdk), which enables semantic code search and AI-assisted analysis of the codebase. KNO SDK provides:

- Semantic code chunk extraction and embedding
- Vector-based code search capabilities
- Autonomous code analysis using LLMs
- Knowledge persistence and sharing via `.kno/` folder

The integration helps with:
- Streamlining onboarding for new contributors
- Finding relevant code patterns across the repository
- Enabling AI assistance for code understanding and debugging
- Documentation generation and maintenance

For usage details, see the [KNO SDK documentation](KNO_SDK_README.md).

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Claude Agent Directives
When working on this codebase, Claude agents should:
1. Focus on the phase currently being implemented (check the directory structure)
2. Prioritize security and efficiency in mining operations
3. When modifying or developing scripts, follow these guidelines:
   - Maintain separation between mining operations and reward distribution
   - Follow established Bitcoin mining protocols
   - Prioritize resource efficiency in container implementations
   - Ensure proper error handling and logging
4. Check directive files in `/directives` for specific instructions