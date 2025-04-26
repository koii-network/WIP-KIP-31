# Phase 1: Orca Task Development

This directory contains the implementation of the Bitcoin mining Orca task for Koii nodes.

## Overview

The Orca task implements the following endpoints:
- `/task/:roundNumber`: Get mining parameters for a specific round
- `/submission/:roundNumber`: Submit mining shares
- `/audit`: View mining statistics and recent shares
- `/healthz`: Check service health

## Components

### 1. Mining Task Service
- Flask application implementing Orca task endpoints
- SQLite database for share storage
- Prometheus metrics integration
- Health checks and monitoring

### 2. Monitoring System
- Prometheus for metrics collection
- Grafana for visualization
- Alert rules for mining performance

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
python tests/test_mining_task.py
```

## API Endpoints

### GET /task/:roundNumber
Returns mining parameters for the specified round:
```json
{
    "round_number": 1,
    "target_difficulty": 1.0,
    "hash_rate": 1000,
    "valid_shares": 10,
    "invalid_shares": 0
}
```

### POST /submission/:roundNumber
Submit a mining share:
```json
{
    "hash": "0000000000000000000000000000000000000000000000000000000000000000",
    "difficulty": 1.0,
    "block_height": 1,
    "worker_id": "worker_1",
    "submission_id": "sub_1"
}
```

### GET /audit
View mining statistics and recent shares:
```json
{
    "statistics": {
        "total_shares": 100,
        "valid_shares": 95,
        "invalid_shares": 5,
        "unique_workers": 10
    },
    "recent_shares": [...]
}
```

### GET /healthz
Check service health:
```json
{
    "status": "healthy",
    "components": {
        "miner": true,
        "metrics": true,
        "api": true,
        "share_collection": true
    },
    "uptime": 3600
}
```

## Monitoring

- Task API: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/admin)

## Metrics

The following metrics are collected:
- Hash rate (H/s)
- CPU usage (%)
- Memory usage (MB)
- Shares submitted
- Valid shares
- Invalid shares
- Mining round number

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