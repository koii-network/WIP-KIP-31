# Koii Mining Task API Deployment

This document provides instructions for deploying the Koii Mining Task API.

## Prerequisites

- macOS 10.15 or later
- Python 3.x
- SQLite3
- Ports 8080 and 8082 available
- Root or sudo access

## Deployment Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd phase-1.5
```

2. Make the deployment script executable:
```bash
chmod +x deploy-macos.sh
```

3. Run the deployment script:
```bash
./deploy-macos.sh
```

## Configuration

The service can be configured using environment variables:

- `PORT`: API server port (default: 8080)
- `LOG_LEVEL`: Logging level (default: INFO)
- `DB_PATH`: Database file path (default: /opt/koii-mining/data/shares.db)

## Service Management

Start the service:
```bash
sudo launchctl load /Library/LaunchDaemons/com.koii-mining.plist
```

Stop the service:
```bash
sudo launchctl unload /Library/LaunchDaemons/com.koii-mining.plist
```

Check service status:
```bash
sudo launchctl list | grep koii-mining
```

## API Endpoints

- `GET /healthz`: Health check endpoint
- `GET /task/<round_number>`: Get mining task
- `POST /submission/<round_number>`: Submit mining share
- `GET /audit`: Get mining statistics

## Monitoring

- Prometheus metrics available on port 8082
- Application logs in `/var/log/koii-mining/`
- System logs via Console.app

## Backup

Run the backup script to create a database backup:
```bash
./backup.sh
```

Backups are stored in `/opt/koii-mining/backups/` and automatically cleaned up after 30 days.

## Troubleshooting

1. Check service status:
```bash
sudo launchctl list | grep koii-mining
```

2. View logs:
```bash
tail -f /var/log/koii-mining/error.log
```

3. Check application logs:
```bash
tail -f /var/log/koii-mining/output.log
```

## Support

For issues or questions, please contact the development team. 