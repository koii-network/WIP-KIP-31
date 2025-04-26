#!/usr/bin/env python3

import os
import sys
import time
import json
import sqlite3
import subprocess
import threading
import requests
from flask import Flask, jsonify
from prometheus_client import start_http_server, Counter, Gauge
import psutil
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/miner.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__)

# Global state
startup_time = time.time()
startup_timeout = 120  # 2 minutes
test_timeout = 300     # 5 minutes
bitcoind_process = None
miner_process = None
health_status = {
    'bitcoind': False,
    'miner': False,
    'metrics': False,
    'api': False,
    'share_collection': False
}

# Prometheus metrics
hash_rate = Gauge('miner_hash_rate', 'Current hash rate in H/s')
cpu_usage = Gauge('miner_cpu_usage', 'CPU usage percentage')
memory_usage = Gauge('miner_memory_usage', 'Memory usage in MB')
shares_submitted = Counter('miner_shares_submitted', 'Total shares submitted')
valid_shares = Counter('miner_valid_shares', 'Total valid shares')
invalid_shares = Counter('miner_invalid_shares', 'Total invalid shares')

def check_timeout():
    while True:
        current_time = time.time()
        if current_time - startup_time > startup_timeout:
            logging.error("Startup timeout reached")
            sys.exit(1)
        if current_time - startup_time > test_timeout:
            logging.error("Test timeout reached")
            sys.exit(1)
        time.sleep(5)

def report_success():
    try:
        requests.post('http://localhost:8080/success', json={
            'timestamp': time.time(),
            'status': 'success',
            'components': health_status,
            'metrics': {
                'hash_rate': hash_rate._value.get(),
                'valid_shares': valid_shares._value.get(),
                'invalid_shares': invalid_shares._value.get()
            }
        })
        logging.info("Success reported")
    except Exception as e:
        logging.error(f"Error reporting success: {e}")

def init_db():
    try:
        conn = sqlite3.connect('/app/data/shares.db')
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS shares
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      timestamp INTEGER,
                      hash TEXT,
                      difficulty REAL,
                      valid INTEGER,
                      block_height INTEGER,
                      worker_id TEXT)''')
        conn.commit()
        conn.close()
        logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        sys.exit(1)

def store_share(hash_value, difficulty, valid, block_height, worker_id):
    try:
        conn = sqlite3.connect('/app/data/shares.db')
        c = conn.cursor()
        c.execute('''INSERT INTO shares 
                     (timestamp, hash, difficulty, valid, block_height, worker_id)
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (int(time.time()), hash_value, difficulty, valid, block_height, worker_id))
        conn.commit()
        conn.close()
        logging.info(f"Share stored: {hash_value[:8]}...")
    except Exception as e:
        logging.error(f"Error storing share: {e}")

def start_bitcoind():
    global bitcoind_process
    try:
        bitcoind_process = subprocess.Popen(['bitcoind', '-conf=/app/config/bitcoin.conf'])
        time.sleep(5)  # Wait for bitcoind to start
        health_status['bitcoind'] = True
        logging.info("Started bitcoind")
    except Exception as e:
        logging.error(f"Error starting bitcoind: {e}")
        sys.exit(1)

def start_miner():
    global miner_process
    try:
        miner_process = subprocess.Popen(['minerd', 
                               '-a', 'sha256d',
                               '-o', 'http://127.0.0.1:8332',
                               '-u', 'testuser',
                               '-p', 'testpass',
                               '--coinbase-addr=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                               '-t', '1'])
        health_status['miner'] = True
        logging.info("Started miner")
    except Exception as e:
        logging.error(f"Error starting miner: {e}")
        sys.exit(1)

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy' if all(health_status.values()) else 'unhealthy',
        'components': health_status,
        'uptime': time.time() - startup_time
    })

@app.route('/stats')
def stats():
    return jsonify({
        'hash_rate': hash_rate._value.get(),
        'cpu_usage': cpu_usage._value.get(),
        'memory_usage': memory_usage._value.get(),
        'shares_submitted': shares_submitted._value.get(),
        'valid_shares': valid_shares._value.get(),
        'invalid_shares': invalid_shares._value.get()
    })

@app.route('/success')
def success():
    report_success()
    return jsonify({'status': 'success reported'})

def monitor_resources():
    while True:
        try:
            cpu_usage.set(psutil.cpu_percent())
            memory_usage.set(psutil.Process().memory_info().rss / 1024 / 1024)
            time.sleep(1)
        except Exception as e:
            logging.error(f"Error monitoring resources: {e}")
            time.sleep(1)

if __name__ == '__main__':
    try:
        # Start timeout monitoring
        timeout_thread = threading.Thread(target=check_timeout, daemon=True)
        timeout_thread.start()

        # Initialize database
        init_db()
        
        # Start bitcoind
        start_bitcoind()
        
        # Start miner
        start_miner()
        
        # Start Prometheus metrics server
        start_http_server(8081)
        health_status['metrics'] = True
        logging.info("Started metrics server")
        
        # Start resource monitoring in background
        monitor_thread = threading.Thread(target=monitor_resources, daemon=True)
        monitor_thread.start()
        logging.info("Started resource monitoring")
        
        # Start Flask app
        health_status['api'] = True
        app.run(host='0.0.0.0', port=8080)
    except Exception as e:
        logging.error(f"Error in main: {e}")
        sys.exit(1) 