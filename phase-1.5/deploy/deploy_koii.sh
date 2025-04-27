#!/bin/bash

# Check if koii-cli is installed
if ! command -v koii-cli &> /dev/null; then
    echo "koii-cli is not installed. Please install it first."
    exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker-compose build

# Deploy to Koii
echo "Deploying to Koii..."
TASK_ID=$(koii-cli task deploy --name "bitcoin-mining-pool" --config task.json)

# Save task ID to file
echo "Saving task ID..."
echo $TASK_ID > task_id.txt

echo "Deployment complete! Task ID: $TASK_ID"
echo "Task ID has been saved to task_id.txt" 