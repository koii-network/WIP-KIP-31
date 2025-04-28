# BTC-Koii: Bitcoin Mining Pools on Koii Network

## Project Overview

BTC-Koii is an innovative blockchain project that implements decentralized Bitcoin mining pools using the Koii Network's infrastructure. The project aims to create a transparent, efficient, and fair mining ecosystem by leveraging Koii's Gradual Consensus model for secure reward distribution.

Key objectives:
- Develop a decentralized Bitcoin mining pool system
- Enable fair and transparent mining rewards distribution
- Utilize Koii Network's Orca tasks for task management
- Implement secure off-chain share collection and verification

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Docker and Docker Compose
- Python 3.8+
- Koii Network access
- KNO SDK (`pip install kno-sdk`)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/btc-koii.git
   cd btc-koii
   ```

2. Navigate to the test environment:
   ```bash
   cd phase-0/test
   ```

3. Start the Docker environment:
   ```bash
   docker-compose up
   ```

## Features and Capabilities

- **Decentralized Mining**: Run Bitcoin mining nodes via Koii Network
- **Secure Reward Distribution**: Utilize K2 native programs for fair rewards
- **Flexible Architecture**: Modular design with multiple implementation phases
- **Docker Containerization**: Consistent and reproducible mining environment
- **Comprehensive Logging and Monitoring**: Track mining performance and shares

### Workflow Phases

1. **Work Phase**: Nodes run Bitcoin miners and produce shares
2. **Submission Phase**: Shares logged in off-chain database with Content Identifier (CID)
3. **Audit Phase**: Nodes verify share validity
4. **Distribution Phase**: Rewards distributed via K2 task contract

## Project Structure

```
btc-koii/
│
├── phase-0/         # Initial feasibility and prototype
│   └── test/        # Test environment and configurations
│
├── phase-1/         # Orca task development
│   ├── src/         # Source code for mining tasks
│   └── docker/      # Dockerfile for containerization
│
├── phase-1.5/       # Deployment and systemd configuration
│   ├── scripts/     # Deployment and management scripts
│   └── config/      # Service and environment configurations
│
└── phase-2/         # Advanced wrapper and integration
    ├── src/         # Bitcoin wrapper implementation
    └── tests/       # Testing suite
```

## Technologies Used

- **Languages**: Python, Docker
- **Blockchain**: Bitcoin, Koii Network (K2)
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Prometheus (configuration included)
- **Deployment**: Systemd, Gunicorn
- **SDK**: KNO SDK for semantic code analysis

## Usage Examples

### Running a Test Mining Environment

```bash
# Navigate to test directory
cd phase-0/test

# Start Docker containers
docker-compose up

# Monitor mining activity
docker-compose logs -f
```

### Deploying Mining Service

```bash
# Navigate to deployment phase
cd phase-1.5

# Start the mining service
./start.sh
```

## KNO SDK Integration

The project is integrated with the KNO SDK to enhance code understanding and maintenance:
- Semantic code chunk extraction
- Vector-based code search
- AI-assisted code analysis
- Knowledge persistence

Refer to [KNO_SDK_README.md](KNO_SDK_README.md) for detailed usage.

## Contributing

1. Review the [implementation plan](plan.md)
2. Check current development phase
3. Follow guidelines in `/directives`
4. Submit pull requests with clear descriptions

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Disclaimer

This is a research and development project focusing on decentralized Bitcoin mining pools. Always ensure compliance with local regulations and mining protocols.