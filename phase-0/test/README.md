# Bitcoin Mining Test Environment

This directory contains a test environment for Bitcoin mining using Koii nodes. The environment includes a Bitcoin miner, monitoring system, and test scripts.

## Components

### 1. Miner Service
- Runs a Bitcoin miner using cpuminer
- Provides health and metrics endpoints
- Collects and stores mining shares
- Exposes Prometheus metrics

### 2. Monitoring System
- Prometheus for metrics collection
- Grafana for visualization
- Alert rules for mining performance
- Health checks and timeouts

### 3. Test Scripts
- `miner.py`: Main miner service
- `monitor.py`: Monitoring service
- `test.py`: Test runner

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

3. Run the test:
```bash
python scripts/test.py
```

## Monitoring

- Miner API: http://localhost:8080
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
- Uptime

## Alerts

The following alerts are configured:

1. Miner Down
2. High CPU Usage
3. High Memory Usage
4. No Valid Shares
5. High Invalid Share Rate

## Logs

Logs are stored in the `logs` directory:
- `miner.log`: Miner service logs
- `monitor.log`: Monitoring service logs
- `test.log`: Test execution logs

## Data

Mining shares are stored in SQLite database:
- Location: `data/shares.db`
- Schema: See `miner.py` for details

## Configuration

- `config/bitcoin.conf`: Bitcoin Core configuration
- `config/prometheus.yml`: Prometheus configuration
- `config/rules.yml`: Alert rules

## Cleanup

To stop and remove all containers:
```bash
docker-compose down -v
``` 