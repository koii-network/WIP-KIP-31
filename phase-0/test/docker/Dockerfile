FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/config

# Copy configuration files
COPY phase-0/test/config/bitcoin.conf /app/config/bitcoin.conf

# Copy source code
COPY phase-1/src /app/src
COPY phase-1/scripts /app/scripts

WORKDIR /app

CMD ["python3", "/app/src/mining_task.py"] 