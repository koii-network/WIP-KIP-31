# BTC-Koii: Bitcoin Mining Pools on Koii Network

## Project Overview

BTC-Koii is an innovative project that implements decentralized Bitcoin mining pools using Koii nodes and Orca tasks, with a focus on secure and fair reward distribution. The project aims to create a transparent, efficient mechanism for mining Bitcoin while leveraging the Koii Network's Gradual Consensus model.

### Key Objectives
- Develop a decentralized Bitcoin mining pool infrastructure
- Enable fair and transparent mining reward distribution
- Utilize Koii Network's unique consensus and task management capabilities
- Create a modular, scalable mining solution

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.8+
- Koii Network access
- KNO SDK (`pip install kno-sdk`)

### Installation
1. Clone the repository
   ```bash
   git clone https://github.com/your-org/btc-koii.git
   cd btc-koii
   ```

2. Navigate to the test environment
   ```bash
   cd phase-0/test
   ```

3. Start the Docker environment
   ```bash
   docker-compose up
   ```

## Features and Capabilities

### Core Components
- **Orca Task Container**: Docker-based Bitcoin mining client
- **Share Collection System**: Off-chain database for tracking mining shares
- **K2 Integration**: Native reward distribution mechanism
- **Bitcoin Wallet**: Single-sig with plans for 2-of-3 multisig upgrade

### Workflow Stages
1. **Work Phase**: Nodes run Bitcoin miners and generate shares
2. **Submission Phase**: Shares stored in off-chain database with CID generation
3. **Audit Phase**: Share validity verification by network nodes
4. **Distribution Phase**: Rewards distributed via K2 task contract

## Project Structure

```
btc-koii/
│
├── phase-0/                # Initial feasibility and prototype phase
│   ├── test/               # Test environment and configurations
│   │   ├── config/         # Bitcoin and monitoring configurations
│   │   ├── scripts/        # Mining and monitoring scripts
│   │   └── docker/         # Containerization resources
│
├── phase-1/                # Orca task development
│   ├── scripts/            # Task implementation scripts
│   ├── src/                # Core source code
│   └── tests/              # Unit and integration tests
│
├── directives/             # Operational guidelines and protocols
├── logs/                   # System and task logs
└── docker-compose.yml      # Primary Docker composition
```

## Technologies Used

- **Languages**: Python, Docker
- **Blockchain**: Bitcoin Core, Koii Network
- **Tools**: 
  - Docker
  - Prometheus (Monitoring)
  - KNO SDK (Code Analysis)
  - Orca Task Framework

## Implementation Roadmap

### Completed Phases
- **Phase 0**: Feasibility study and local prototype
- **Phase 1**: Orca task development and initial implementation

### Upcoming Phases
Refer to the [implementation plan](plan.md) for details on future development stages.

## KNO SDK Integration

The project integrates the KNO SDK to enhance:
- Semantic code search
- AI-assisted code analysis
- Knowledge persistence
- Collaborative development

## Usage Examples

Run mining test script:
```bash
cd phase-0/test
python scripts/miner.py
```

Monitor mining performance:
```bash
python scripts/monitor.py
```

## Development Guidelines

When contributing:
- Follow established Bitcoin mining protocols
- Prioritize security and efficiency
- Maintain clear separation between mining and reward distribution logic
- Implement comprehensive error handling and logging

## Documentation

- [Main Implementation Plan](plan.md)
- [Phase 0 Detailed Plan](phase-0/plan.md)
- [Test Documentation](phase-0/test/README.md)
- [KNO SDK Usage Guide](KNO_SDK_README.md)

## License

This project is licensed under the MIT License. See the LICENSE file for complete details.

## Disclaimer

This is a research and development project focused on legal, transparent Bitcoin mining pool technologies. All operations are conducted in controlled, test environments.