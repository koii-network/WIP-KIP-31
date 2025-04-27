#!/bin/bash

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install docker
    # For Ubuntu/Debian
    elif [[ -f /etc/debian_version ]]; then
        sudo apt-get update
        sudo apt-get install -y docker.io
    # For CentOS/RHEL
    elif [[ -f /etc/redhat-release ]]; then
        sudo yum install -y docker
    else
        echo "Unsupported operating system. Please install Docker manually."
        exit 1
    fi
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install docker-compose
    # For Ubuntu/Debian
    elif [[ -f /etc/debian_version ]]; then
        sudo apt-get install -y docker-compose
    # For CentOS/RHEL
    elif [[ -f /etc/redhat-release ]]; then
        sudo yum install -y docker-compose
    else
        echo "Unsupported operating system. Please install Docker Compose manually."
        exit 1
    fi
fi

# Install Koii CLI if not installed
if ! command -v koii-cli &> /dev/null; then
    echo "Installing Koii CLI..."
    npm install -g @koii-network/cli
fi

# Start Docker service
echo "Starting Docker service..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Docker
else
    sudo systemctl start docker
fi

echo "Setup complete! Please ensure Docker is running before deploying." 