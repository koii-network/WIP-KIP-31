#!/usr/bin/env python3

import os
import sys
import time
import json
import requests
from prometheus_client import start_http_server, Gauge
import psutil

# Global state
start_time = time.time()
timeout = 300  # 5 minutes
health_checks = {
    'miner_api': False,
    'metrics': False,
    'bitcoind': False
}

# Prometheus metrics
miner_hash_rate = Gauge('miner_hash_rate', 'Current hash rate in H/s')
miner_cpu_usage = Gauge('miner_cpu_usage', 'CPU usage percentage')
miner_memory_usage = Gauge('miner_memory_usage', 'Memory usage in MB')
miner_shares = Gauge('miner_shares_submitted', 'Total shares submitted')
miner_health = Gauge('miner_health', 'Health status of miner components')

def check_timeout():
    while True:
        if time.time() - start_time > timeout:
            print("Monitor timeout reached")
            sys.exit(1)
        time.sleep(5)

def check_health():
    while True:
        try:
            # Check miner API health
            response = requests.get('http://localhost:8080/health')
            if response.status_code == 200:
                health_data = response.json()
                health_checks['miner_api'] = health_data['status'] == 'healthy'
                health_checks['bitcoind'] = health_data['components']['bitcoind']
                print(f"Health check: {health_data}")
            else:
                print(f"Health check failed: {response.status_code}")
        except Exception as e:
            print(f"Error checking health: {e}")
        
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
                health_checks['metrics'] = True
                print(f"Updated metrics: {stats}")
            else:
                print(f"Failed to get metrics: {response.status_code}")
        except Exception as e:
            print(f"Error collecting metrics: {e}")
        
        time.sleep(5)

if __name__ == '__main__':
    try:
        # Start Prometheus metrics server
        start_http_server(8081)
        print("Started Prometheus metrics server on port 8081")
        
        # Start timeout monitoring
        import threading
        timeout_thread = threading.Thread(target=check_timeout, daemon=True)
        timeout_thread.start()
        
        # Start health checking
        health_thread = threading.Thread(target=check_health, daemon=True)
        health_thread.start()
        
        # Start metric collection
        print("Starting metrics collection...")
        collect_metrics()
    except Exception as e:
        print(f"Error in main: {e}")
        sys.exit(1) 