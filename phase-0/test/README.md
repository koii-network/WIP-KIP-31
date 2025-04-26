# Bitcoin Mining Test Environment

This directory contains a test environment for validating Bitcoin mining operations within Koii's Orca task framework.

## Directory Structure

```
test/
├── docker/           # Docker-related files
├── scripts/          # Python scripts
├── config/          # Configuration files
├── data/            # Persistent data
└── logs/            # Log files
```

## Prerequisites

- Docker
- Docker Compose
- Python 3.8+
- Git

## Setup

1. Build and start the containers:
```bash
docker-compose up --build
```

2. Access the services:
- Miner API: http://localhost:8080
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Monitoring

The environment includes:
- Prometheus for metrics collection
- Grafana for visualization
- Custom monitoring scripts

## Testing

1. Check miner health:
```bash
curl http://localhost:8080/health
```

2. View mining statistics:
```bash
curl http://localhost:8080/stats
```

## Logs

Logs are stored in the `logs` directory and can be accessed through Docker:
```bash
docker-compose logs -f miner
```

## Configuration

- Bitcoin configuration: `config/bitcoin.conf`
- Prometheus configuration: `config/prometheus.yml`
- Docker configuration: `docker-compose.yml`

## Troubleshooting

1. Check container status:
```bash
docker-compose ps
```

2. View container logs:
```bash
docker-compose logs [service_name]
```

3. Restart services:
```bash
docker-compose restart [service_name]
```

## Cleanup

To stop and remove all containers:
```bash
docker-compose down -v
``` 