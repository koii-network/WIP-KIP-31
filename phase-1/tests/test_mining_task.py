#!/usr/bin/env python3

import os
import sys
import json
import unittest
import sqlite3

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.mining_task import app, init_db

class TestMiningTask(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Set up test database
        self.test_db_path = 'data/test_shares.db'
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)
            
        # Initialize database with test data
        self.conn = sqlite3.connect(self.test_db_path)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE shares (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                round_number INTEGER,
                timestamp INTEGER,
                nonce TEXT,
                difficulty REAL,
                valid INTEGER,
                verified INTEGER,
                worker_id TEXT,
                submission_id TEXT
            )
        ''')
        self.conn.commit()
        
        # Add some test data
        test_data = [
            (1, 1745687089, '0000000000000000000000000000000000000000000000000000000000000000', 1.0, 1, 1, 'test_worker_1', 'test_submission_1'),
            (1, 1745687121, '0000000000000000000000000000000000000000000000000000000000000000', 1.0, 1, 1, 'test_worker_1', 'test_submission_1'),
            (1, 1745687176, '0000000000000000000000000000000000000000000000000000000000000000', 1.0, 1, 1, 'test_worker_1', 'test_submission_1'),
            (1, 1745687350, '0000000000000000000000000000000000000000000000000000000000000000', 1.0, 1, 1, 'test_worker_1', 'test_submission_1')
        ]
        self.cursor.executemany(
            'INSERT INTO shares (round_number, timestamp, nonce, difficulty, valid, verified, worker_id, submission_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            test_data
        )
        self.conn.commit()
        
        self.test_round = 1
        init_db()

    def tearDown(self):
        self.conn.close()
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    def test_health_endpoint(self):
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('components', data)
        self.assertIn('share_collection', data['components'])

    def test_task_endpoint(self):
        response = self.client.get(f'/task/{self.test_round}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['round_number'], self.test_round)
        self.assertIn('target_difficulty', data)
        self.assertIn('hash_rate', data)
        self.assertIn('valid_shares', data)
        self.assertIn('invalid_shares', data)

    def test_submission_endpoint(self):
        test_data = {
            'hash': '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
            'difficulty': 1.0,
            'block_height': 1,
            'worker_id': 'test_worker',
            'submission_id': 'test_submission_1',
            'valid': True
        }
        response = self.client.post(
            f'/submission/{self.test_round}',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')

    def test_audit_endpoint(self):
        # First submit a test share
        test_data = {
            'hash': '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
            'difficulty': 1.0,
            'block_height': 1,
            'worker_id': 'test_worker',
            'submission_id': 'test_submission_2',
            'valid': True
        }
        self.client.post(
            f'/submission/{self.test_round}',
            data=json.dumps(test_data),
            content_type='application/json'
        )

        # Now test the audit endpoint
        response = self.client.get('/audit')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        # Check the response structure
        self.assertIn('statistics', data)
        self.assertIn('recent_shares', data)
        
        # Check statistics fields
        stats = data['statistics']
        self.assertIn('total_shares', stats)
        self.assertIn('valid_shares', stats)
        self.assertIn('invalid_shares', stats)
        self.assertIn('unique_workers', stats)
        
        # Verify we have at least one share
        self.assertGreater(stats['total_shares'], 0)
        self.assertGreater(len(data['recent_shares']), 0)

if __name__ == '__main__':
    unittest.main() 