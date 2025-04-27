#!/usr/bin/env python3

import os
import sys
import sqlite3
import pytest
import time
from pathlib import Path

# Add src directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import test utilities
from test_utils.fixtures import test_db_path, sample_share_data

class TestDatabaseOperations:
    @pytest.fixture
    def db_conn(self, test_db_path):
        """Create and return a database connection."""
        conn = sqlite3.connect(test_db_path)
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
        conn.commit()
        
        yield conn
        
        # Cleanup
        conn.close()
        os.remove(test_db_path)

    def test_insert_share(self, db_conn, sample_share_data):
        """Test inserting a share into the database."""
        c = db_conn.cursor()
        
        # Insert share
        c.execute('''INSERT INTO shares 
                     (round_number, timestamp, hash, difficulty, valid, 
                      block_height, worker_id, submission_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (sample_share_data['round_number'],
                   int(time.time()),
                   sample_share_data['hash'],
                   sample_share_data['difficulty'],
                   int(sample_share_data['valid']),
                   sample_share_data['block_height'],
                   sample_share_data['worker_id'],
                   sample_share_data['submission_id']))
        db_conn.commit()
        
        # Verify insertion
        c.execute('SELECT * FROM shares WHERE submission_id = ?',
                  (sample_share_data['submission_id'],))
        result = c.fetchone()
        
        assert result is not None, "Share was not inserted"
        assert result[1] == sample_share_data['round_number'], "Round number mismatch"
        assert result[3] == sample_share_data['hash'], "Hash mismatch"
        assert result[4] == sample_share_data['difficulty'], "Difficulty mismatch"

    def test_select_shares(self, db_conn, sample_share_data):
        """Test selecting shares from the database."""
        c = db_conn.cursor()
        
        # Insert test data
        for i in range(3):
            data = sample_share_data.copy()
            data['submission_id'] = f"test_{i}"
            c.execute('''INSERT INTO shares 
                         (round_number, timestamp, hash, difficulty, valid,
                          block_height, worker_id, submission_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                      (data['round_number'],
                       int(time.time()),
                       data['hash'],
                       data['difficulty'],
                       int(data['valid']),
                       data['block_height'],
                       data['worker_id'],
                       data['submission_id']))
        db_conn.commit()
        
        # Test select all
        c.execute('SELECT * FROM shares')
        results = c.fetchall()
        assert len(results) == 3, "Incorrect number of shares returned"
        
        # Test select with filter
        c.execute('SELECT * FROM shares WHERE submission_id = ?',
                  ('test_1',))
        result = c.fetchone()
        assert result is not None, "Filtered share not found"
        assert result[8] == 'test_1', "Incorrect share returned"

    def test_update_share(self, db_conn, sample_share_data):
        """Test updating a share in the database."""
        c = db_conn.cursor()
        
        # Insert test data
        c.execute('''INSERT INTO shares 
                     (round_number, timestamp, hash, difficulty, valid,
                      block_height, worker_id, submission_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (sample_share_data['round_number'],
                   int(time.time()),
                   sample_share_data['hash'],
                   sample_share_data['difficulty'],
                   int(sample_share_data['valid']),
                   sample_share_data['block_height'],
                   sample_share_data['worker_id'],
                   sample_share_data['submission_id']))
        db_conn.commit()
        
        # Update share
        new_difficulty = 2.0
        c.execute('''UPDATE shares 
                     SET difficulty = ? 
                     WHERE submission_id = ?''',
                  (new_difficulty, sample_share_data['submission_id']))
        db_conn.commit()
        
        # Verify update
        c.execute('SELECT difficulty FROM shares WHERE submission_id = ?',
                  (sample_share_data['submission_id'],))
        result = c.fetchone()
        assert result[0] == new_difficulty, "Share was not updated"

    def test_delete_share(self, db_conn, sample_share_data):
        """Test deleting a share from the database."""
        c = db_conn.cursor()
        
        # Insert test data
        c.execute('''INSERT INTO shares 
                     (round_number, timestamp, hash, difficulty, valid,
                      block_height, worker_id, submission_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (sample_share_data['round_number'],
                   int(time.time()),
                   sample_share_data['hash'],
                   sample_share_data['difficulty'],
                   int(sample_share_data['valid']),
                   sample_share_data['block_height'],
                   sample_share_data['worker_id'],
                   sample_share_data['submission_id']))
        db_conn.commit()
        
        # Delete share
        c.execute('DELETE FROM shares WHERE submission_id = ?',
                  (sample_share_data['submission_id'],))
        db_conn.commit()
        
        # Verify deletion
        c.execute('SELECT * FROM shares WHERE submission_id = ?',
                  (sample_share_data['submission_id'],))
        result = c.fetchone()
        assert result is None, "Share was not deleted"

if __name__ == '__main__':
    pytest.main([__file__]) 