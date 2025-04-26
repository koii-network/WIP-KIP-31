# Phase 2: K2 Integration

This directory contains the implementation of K2 integration for the Bitcoin mining pool, enabling reward distribution through the Koii Network.

## Overview

Phase 2 implements the following components:
- Custom native program for BTC wrapping
- Distribution logic for mining rewards
- K2 token minting and distribution system

## Components

### 1. BTC Wrapping Program
- Native program for wrapping Bitcoin rewards
- Integration with Bitcoin Core
- Secure key management
- Transaction signing

### 2. Distribution System
- Reward calculation logic
- Distribution scheduling
- Transaction batching
- Error handling and retries

### 3. K2 Integration
- Token minting contract
- Distribution contract
- Integration with Koii Network
- Monitoring and metrics

## Setup

1. Install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Build and start the environment:
```bash
docker-compose up --build
```

3. Run tests:
```bash
python tests/test_k2_integration.py
```

## Development

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install development dependencies:
```bash
pip install -r requirements.txt
```

3. Run tests:
```bash
python -m pytest tests/
```

4. Format code:
```bash
black src/ tests/
```

5. Lint code:
```bash
flake8 src/ tests/
```

## Cleanup

To stop and remove all containers:
```bash
docker-compose down -v
``` 