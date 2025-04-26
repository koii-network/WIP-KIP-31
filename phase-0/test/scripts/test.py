#!/usr/bin/env python3

import os
import sys
import time
import json
import requests
import subprocess
from datetime import datetime

def run_test():
    start_time = time.time()
    timeout = 300  # 5 minutes
    
    print(f"Starting test at {datetime.now()}")
    
    try:
        # Start the environment
        print("Starting containers...")
        subprocess.run(["docker-compose", "up", "-d"], check=True)
        
        # Wait for containers to start
        time.sleep(30)
        
        # Monitor health and metrics
        while time.time() - start_time < timeout:
            try:
                # Check health
                health_response = requests.get("http://localhost:8080/health")
                if health_response.status_code == 200:
                    health_data = health_response.json()
                    print(f"Health check: {health_data}")
                    
                    if health_data['status'] == 'healthy':
                        # Check metrics
                        metrics_response = requests.get("http://localhost:8080/stats")
                        if metrics_response.status_code == 200:
                            metrics_data = metrics_response.json()
                            print(f"Metrics: {metrics_data}")
                            
                            # Report success
                            success_response = requests.post("http://localhost:8080/success")
                            if success_response.status_code == 200:
                                print("Success reported!")
                                return True
            except Exception as e:
                print(f"Error during monitoring: {e}")
            
            time.sleep(15)
        
        print("Test timeout reached")
        return False
        
    except Exception as e:
        print(f"Test failed: {e}")
        return False
    finally:
        # Clean up
        print("Cleaning up...")
        subprocess.run(["docker-compose", "down"], check=True)

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1) 