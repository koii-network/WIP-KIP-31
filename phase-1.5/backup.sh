#!/bin/bash

# Configuration
APP_DIR="/opt/koii-mining"
BACKUP_DIR="/opt/koii-mining/backups"
DB_FILE="$APP_DIR/data/shares.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/shares_$TIMESTAMP.db"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating database backup..."
cp $DB_FILE $BACKUP_FILE

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_FILE

# Remove backups older than 30 days
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "shares_*.db.gz" -mtime +30 -delete

echo "Backup completed successfully!"
echo "Backup file: $BACKUP_FILE.gz" 