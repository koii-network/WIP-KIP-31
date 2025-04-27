#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Set default values if not set
export PORT=${PORT:-8085}
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export DB_PATH=${DB_PATH:-data/shares.db}

# Create necessary directories
mkdir -p data logs

# Activate virtual environment
source venv/bin/activate

# Start the application
exec venv/bin/gunicorn \
    --bind 0.0.0.0:${PORT} \
    --workers 4 \
    --timeout 120 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log \
    src.mining_task:app 