#!/usr/bin/env python3

import os
import sys
import time
import json
import requests
import logging
from prometheus_client import start_http_server, Gauge
import psutil
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/monitor.log'),
        logging.StreamHandler()
    ]
)

# Global state
start_time = time.time()
timeout = 300  # 5 minutes
health_checks = {
    'miner_api': False,
    'metrics': False,
    'bitcoind': False,
    'share_collection': False
}

# Prometheus metrics
miner_hash_rate = Gauge('miner_hash_rate', 'Current hash rate in H/s')
miner_cpu_usage = Gauge('miner_cpu_usage', 'CPU usage percentage')
miner_memory_usage = Gauge('miner_memory_usage', 'Memory usage in MB')
miner_shares = Gauge('miner_shares_submitted', 'Total shares submitted')
miner_valid_shares = Gauge('miner_valid_shares', 'Total valid shares')
miner_invalid_shares = Gauge('miner_invalid_shares', 'Total invalid shares')
miner_health = Gauge('miner_health', 'Health status of miner components')
miner_uptime = Gauge('miner_uptime', 'Miner uptime in seconds')

def check_timeout():
    while True:
        if time.time() - start_time > timeout:
            logging.error("Monitor timeout reached")
            sys.exit(1)
        time.sleep(5)

def check_share_collection():
    try:
        conn = sqlite3.connect('/app/data/shares.db')
        c = conn.cursor()
        c.execute('SELECT COUNT(*) FROM shares')
        count = c.fetchone()[0]
        conn.close()
        health_checks['share_collection'] = count > 0
        logging.info(f"Share collection check: {count} shares found")
    except Exception as e:
        logging.error(f"Error checking share collection: {e}")
        health_checks['share_collection'] = False

def check_health():
    while True:
        try:
            # Check miner API health
            response = requests.get('http://localhost:8080/health')
            if response.status_code == 200:
                health_data = response.json()
                health_checks['miner_api'] = health_data['status'] == 'healthy'
                health_checks['bitcoind'] = health_data['components']['bitcoind']
                miner_uptime.set(health_data['uptime'])
                logging.info(f"Health check: {health_data}")
            else:
                logging.error(f"Health check failed: {response.status_code}")
        except Exception as e:
            logging.error(f"Error checking health: {e}")
        
        check_share_collection()
        time.sleep(15)

def collect_metrics():
    while True:
        try:
            # Get metrics from miner API
            response = requests.get('http://localhost:8080/stats')
            if response.status_code == 200:
                stats = response.json()
                miner_hash_rate.set(stats['hash_rate'])
                miner_cpu_usage.set(stats['cpu_usage'])
                miner_memory_usage.set(stats['memory_usage'])
                miner_shares.set(stats['shares_submitted'])
                miner_valid_shares.set(stats['valid_shares'])
                miner_invalid_shares.set(stats['invalid_shares'])
                health_checks['metrics'] = True
                logging.info(f"Updated metrics: {stats}")
            else:
                logging.error(f"Failed to get metrics: {response.status_code}")
        except Exception as e:
            logging.error(f"Error collecting metrics: {e}")
        
        time.sleep(5)

if __name__ == '__main__':
    try:
        # Start Prometheus metrics server
        start_http_server(8081)
        logging.info("Started Prometheus metrics server on port 8081")
        
        # Start timeout monitoring
        import threading
        timeout_thread = threading.Thread(target=check_timeout, daemon=True)
        timeout_thread.start()
        
        # Start health checking
        health_thread = threading.Thread(target=check_health, daemon=True)
        health_thread.start()
        
        # Start metric collection
        logging.info("Starting metrics collection...")
        collect_metrics()
    except Exception as e:
        logging.error(f"Error in main: {e}")
        sys.exit(1) 