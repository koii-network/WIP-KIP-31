#!/usr/bin/env python3

import os
import sys
import sqlite3
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

def test_db_init():
    try:
        # Set up test environment
        test_dir = os.path.join(os.path.dirname(__file__), 'test_data')
        os.makedirs(test_dir, exist_ok=True)
        db_path = os.path.join(test_dir, 'test_shares.db')
        
        # Initialize database
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Create table
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
        
        # Test insert
        c.execute('''INSERT INTO shares 
                     (round_number, timestamp, hash, difficulty, valid, block_height, worker_id, submission_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (1, 1234567890, 'test_hash', 1.0, 1, 1, 'test_worker', 'test_submission'))
        
        # Test select
        c.execute('SELECT * FROM shares')
        result = c.fetchone()
        
        # Verify results
        if result:
            logging.info("Database test successful!")
            logging.info(f"Retrieved record: {result}")
        else:
            logging.error("No records found in database")
            return False
        
        conn.commit()
        conn.close()
        
        # Clean up
        os.remove(db_path)
        os.rmdir(test_dir)
        
        return True
        
    except Exception as e:
        logging.error(f"Database test failed: {e}")
        return False

if __name__ == '__main__':
    success = test_db_init()
    sys.exit(0 if success else 1) 