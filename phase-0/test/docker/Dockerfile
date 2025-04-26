FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
    libdb++-dev \
    libboost-all-dev \
    libqrencode-dev \
    libminiupnpc-dev \
    git \
    python3 \
    python3-pip \
    sqlite3 \
    wget \
    autoconf \
    automake \
    libtool \
    pkg-config \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install flask prometheus_client psutil requests

# Create working directory
WORKDIR /app

# Install Bitcoin Core
RUN wget https://bitcoin.org/bin/bitcoin-core-25.0/bitcoin-25.0-x86_64-linux-gnu.tar.gz && \
    tar -xzf bitcoin-25.0-x86_64-linux-gnu.tar.gz && \
    install -m 0755 -o root -g root -t /usr/local/bin bitcoin-25.0/bin/* && \
    rm -rf bitcoin-25.0*

# Clone and build cpuminer
RUN git clone https://github.com/pooler/cpuminer.git && \
    cd cpuminer && \
    ./autogen.sh && \
    ./configure CFLAGS="-O3" && \
    make -j$(nproc) && \
    cp minerd /usr/local/bin/

# Copy application files
COPY scripts/miner.py /app/scripts/
COPY scripts/monitor.py /app/scripts/
COPY config/bitcoin.conf /app/config/

# Create necessary directories
RUN mkdir -p /app/data /app/logs

# Expose ports
EXPOSE 8080 8332 8333

# Set environment variables
ENV BITCOIN_DATA=/app/data
ENV BITCOIN_CONF=/app/config/bitcoin.conf

# Set working directory for scripts
WORKDIR /app/scripts

# Start script
CMD ["python3", "miner.py"] 