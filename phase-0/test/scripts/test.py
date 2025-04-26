#!/usr/bin/env python3

import os
import sys
import time
import json
import requests
import logging
import subprocess
from datetime import datetime
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test.log'),
        logging.StreamHandler()
    ]
)

class MiningTest:
    def __init__(self):
        self.start_time = time.time()
        self.timeout = 300  # 5 minutes
        self.miner_url = "http://localhost:8080"
        self.metrics_url = "http://localhost:8081"
        self.prometheus_url = "http://localhost:9090"
        self.grafana_url = "http://localhost:3000"

    def check_health(self):
        try:
            response = requests.get(f"{self.miner_url}/health")
            if response.status_code == 200:
                health = response.json()
                logging.info(f"Health check: {health}")
                return health['status'] == 'healthy'
            return False
        except Exception as e:
            logging.error(f"Health check failed: {e}")
            return False

    def check_metrics(self):
        try:
            response = requests.get(f"{self.miner_url}/stats")
            if response.status_code == 200:
                metrics = response.json()
                logging.info(f"Metrics: {metrics}")
                return True
            return False
        except Exception as e:
            logging.error(f"Metrics check failed: {e}")
            return False

    def check_share_collection(self):
        try:
            conn = sqlite3.connect('/app/data/shares.db')
            c = conn.cursor()
            c.execute('SELECT COUNT(*) FROM shares')
            count = c.fetchone()[0]
            conn.close()
            logging.info(f"Share count: {count}")
            return count > 0
        except Exception as e:
            logging.error(f"Share collection check failed: {e}")
            return False

    def run_test(self):
        logging.info("Starting mining test...")
        
        # Wait for services to start
        time.sleep(10)
        
        # Check health
        if not self.check_health():
            logging.error("Health check failed")
            return False
        
        # Check metrics
        if not self.check_metrics():
            logging.error("Metrics check failed")
            return False
        
        # Monitor for shares
        shares_found = False
        while time.time() - self.start_time < self.timeout:
            if self.check_share_collection():
                shares_found = True
                break
            time.sleep(10)
        
        if not shares_found:
            logging.error("No shares found within timeout")
            return False
        
        # Report success
        try:
            response = requests.post(f"{self.miner_url}/success")
            if response.status_code == 200:
                logging.info("Success reported")
                return True
            return False
        except Exception as e:
            logging.error(f"Success report failed: {e}")
            return False

def main():
    test = MiningTest()
    success = test.run_test()
    
    if success:
        logging.info("Test completed successfully")
        sys.exit(0)
    else:
        logging.error("Test failed")
        sys.exit(1)

if __name__ == "__main__":
    main() 