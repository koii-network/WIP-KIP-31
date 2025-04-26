#!/usr/bin/env python3

import os
import sys
import time
import json
import logging
import requests
import subprocess
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test.log'),
        logging.StreamHandler()
    ]
)

def run_command(command):
    """Run a shell command and return its output."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        logging.error(f"Command failed: {e.stderr}")
        raise

def check_health():
    """Check the health of the mining task service."""
    try:
        response = requests.get('http://localhost:8080/healthz', timeout=5)
        if response.status_code == 200:
            data = response.json()
            logging.info(f"Health check response: {data}")
            return data['status'] == 'healthy'
        return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Health check failed: {e}")
        return False

def check_success():
    """Check if the mining task has achieved success."""
    try:
        response = requests.get('http://localhost:8080/audit', timeout=5)
        if response.status_code == 200:
            data = response.json()
            logging.info(f"Audit response: {data}")
            # Consider success if we have at least one valid share
            valid_shares = data['statistics']['valid_shares'] or 0
            return valid_shares > 0
        return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Success check failed: {e}")
        return False

def cleanup():
    """Clean up Docker resources."""
    try:
        run_command('docker-compose down -v')
        logging.info("Cleanup completed successfully")
    except Exception as e:
        logging.error(f"Cleanup failed: {e}")

def main():
    try:
        # Start the environment
        logging.info("Starting environment...")
        run_command('docker-compose up -d')
        
        # Wait for services to start
        time.sleep(10)
        
        # Set timeout for the entire test
        timeout = datetime.now() + timedelta(minutes=5)
        
        # Check health until timeout
        while datetime.now() < timeout:
            if check_health():
                logging.info("Health check passed")
                break
            logging.info("Waiting for health check to pass...")
            time.sleep(5)
        
        if datetime.now() >= timeout:
            logging.error("Health check timeout")
            cleanup()
            sys.exit(1)
        
        # Check for success until timeout
        while datetime.now() < timeout:
            if check_success():
                logging.info("Success condition met")
                cleanup()
                sys.exit(0)
            logging.info("Waiting for success condition...")
            time.sleep(10)
        
        logging.error("Success check timeout")
        cleanup()
        sys.exit(1)
        
    except Exception as e:
        logging.error(f"Test failed: {e}")
        cleanup()
        sys.exit(1)

if __name__ == '__main__':
    main() 