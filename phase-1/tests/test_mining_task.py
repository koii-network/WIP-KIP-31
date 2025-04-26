#!/usr/bin/env python3

import os
import sys

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
import json
import unittest
import logging
import sqlite3
from datetime import datetime
from src.mining_task import app, init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test.log'),
        logging.StreamHandler()
    ]
)

def init_test_db():
    try:
        conn = sqlite3.connect('data/shares.db')
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS shares
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      round_number INTEGER,
                      timestamp INTEGER,
                      hash TEXT,
                      difficulty REAL,
                      valid INTEGER,
                      block_height INTEGER,
                      worker_id TEXT,
                      submission_id TEXT)''')
        conn.commit()
        conn.close()
        logging.info("Test database initialized successfully")
    except Exception as e:
        logging.error(f"Error initializing test database: {e}")
        sys.exit(1)

class TestMiningTask(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        self.test_round = 1
        self.test_worker_id = "test_worker_1"
        self.test_submission_id = "test_submission_1"
        init_test_db()
        
    def test_health_endpoint(self):
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertIn('components', data)
        self.assertIn('uptime', data)
        
    def test_task_endpoint(self):
        response = self.client.get(f'/task/{self.test_round}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
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
        response = self.client.post(
            f'/submission/{self.test_round}',
            json=submission_data
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        
        # Test invalid submission (missing fields)
        invalid_data = {
            'hash': '0000000000000000000000000000000000000000000000000000000000000000'
        }
        response = self.client.post(
            f'/submission/{self.test_round}',
            json=invalid_data
        )
        self.assertEqual(response.status_code, 400)
        
    def test_audit_endpoint(self):
        response = self.client.get('/audit')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('statistics', data)
        self.assertIn('recent_shares', data)
        
        # Verify statistics structure
        stats = data['statistics']
        self.assertIn('total_shares', stats)
        self.assertIn('valid_shares', stats)
        self.assertIn('invalid_shares', stats)
        self.assertIn('unique_workers', stats)

def main():
    # Run tests
    logging.info("Starting tests...")
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
    logging.info("Tests completed")

if __name__ == '__main__':
    main() 