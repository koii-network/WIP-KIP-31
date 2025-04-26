#!/usr/bin/env python3

import os
import sys
import time
import json
import unittest
import requests
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test.log'),
        logging.StreamHandler()
    ]
)

class TestMiningTask(unittest.TestCase):
    def setUp(self):
        self.base_url = "http://localhost:8080"
        self.test_round = 1
        self.test_worker_id = "test_worker_1"
        self.test_submission_id = "test_submission_1"
        
    def test_health_endpoint(self):
        response = requests.get(f"{self.base_url}/healthz")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('components', data)
        self.assertIn('uptime', data)
        
    def test_task_endpoint(self):
        response = requests.get(f"{self.base_url}/task/{self.test_round}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('round_number', data)
        self.assertIn('target_difficulty', data)
        self.assertIn('hash_rate', data)
        self.assertIn('valid_shares', data)
        self.assertIn('invalid_shares', data)
        
    def test_submission_endpoint(self):
        # Test valid submission
        submission_data = {
            'hash': '0000000000000000000000000000000000000000000000000000000000000000',
            'difficulty': 1.0,
            'block_height': 1,
            'worker_id': self.test_worker_id,
            'submission_id': self.test_submission_id
        }
        response = requests.post(
            f"{self.base_url}/submission/{self.test_round}",
            json=submission_data
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        
        # Test invalid submission (missing fields)
        invalid_data = {
            'hash': '0000000000000000000000000000000000000000000000000000000000000000'
        }
        response = requests.post(
            f"{self.base_url}/submission/{self.test_round}",
            json=invalid_data
        )
        self.assertEqual(response.status_code, 400)
        
    def test_audit_endpoint(self):
        response = requests.get(f"{self.base_url}/audit")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('statistics', data)
        self.assertIn('recent_shares', data)
        
        # Verify statistics structure
        stats = data['statistics']
        self.assertIn('total_shares', stats)
        self.assertIn('valid_shares', stats)
        self.assertIn('invalid_shares', stats)
        self.assertIn('unique_workers', stats)

def main():
    # Wait for services to start
    logging.info("Waiting for services to start...")
    time.sleep(10)
    
    # Run tests
    logging.info("Starting tests...")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
    
    logging.info("Tests completed")

if __name__ == '__main__':
    main() 