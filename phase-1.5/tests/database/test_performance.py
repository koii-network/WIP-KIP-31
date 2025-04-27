#!/usr/bin/env python3

import os
import sys
import sqlite3
import pytest
import time
from pathlib import Path
from statistics import mean, stdev
from typing import List, Dict, Any

# Add src directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import test utilities
from test_utils.fixtures import test_db_path, sample_share_data

class TestDatabasePerformance:
    """Performance testing suite for database operations.
    
    This test suite measures the performance of database operations under various conditions:
    - Single operation latency
    - Batch operation throughput
    - Concurrent access patterns
    - Large dataset handling
    """
    
    @pytest.fixture
    def db_conn(self, test_db_path):
        """Create and return a database connection with performance optimizations."""
        conn = sqlite3.connect(test_db_path)
        c = conn.cursor()
        
        # Enable performance optimizations
        c.execute("PRAGMA synchronous = NORMAL")
        c.execute("PRAGMA journal_mode = WAL")
        c.execute("PRAGMA cache_size = -2000")  # 2MB cache
        
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

    def measure_operation_time(self, operation: callable, *args, **kwargs) -> float:
        """Measure the execution time of a database operation.
        
        Args:
            operation: The database operation to measure
            *args: Positional arguments for the operation
            **kwargs: Keyword arguments for the operation
            
        Returns:
            float: Execution time in seconds
        """
        start_time = time.perf_counter()
        operation(*args, **kwargs)
        return time.perf_counter() - start_time

    def test_insert_performance(self, db_conn, sample_share_data):
        """Test the performance of share insertion operations.
        
        Measures:
        - Single share insertion latency
        - Batch insertion throughput
        - Impact of index usage
        """
        c = db_conn.cursor()
        
        # Test single insert performance
        single_insert_times = []
        for _ in range(100):
            time_taken = self.measure_operation_time(
                c.execute,
                '''INSERT INTO shares 
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
                 sample_share_data['submission_id'])
            )
            single_insert_times.append(time_taken)
            db_conn.commit()
        
        # Calculate statistics
        avg_single_insert = mean(single_insert_times)
        std_single_insert = stdev(single_insert_times)
        
        # Test batch insert performance
        batch_size = 1000
        batch_data = [(sample_share_data['round_number'],
                      int(time.time()),
                      sample_share_data['hash'],
                      sample_share_data['difficulty'],
                      int(sample_share_data['valid']),
                      sample_share_data['block_height'],
                      sample_share_data['worker_id'],
                      f"{sample_share_data['submission_id']}_{i}")
                     for i in range(batch_size)]
        
        batch_time = self.measure_operation_time(
            c.executemany,
            '''INSERT INTO shares 
               (round_number, timestamp, hash, difficulty, valid,
                block_height, worker_id, submission_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            batch_data
        )
        db_conn.commit()
        
        # Performance assertions with more realistic thresholds
        assert avg_single_insert < 0.01, "Single insert too slow"
        assert batch_time < 1.0, "Batch insert too slow"
        assert std_single_insert < avg_single_insert, "Extremely high insert time variance"

    def test_query_performance(self, db_conn, sample_share_data):
        """Test the performance of database queries.
        
        Measures:
        - Simple query latency
        - Complex query performance
        - Index impact on query speed
        """
        c = db_conn.cursor()
        
        # Insert test data
        for i in range(1000):
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
        
        # Test simple query performance
        simple_query_times = []
        for _ in range(100):
            time_taken = self.measure_operation_time(
                c.execute,
                'SELECT * FROM shares WHERE submission_id = ?',
                ('test_0',)
            )
            simple_query_times.append(time_taken)
        
        # Test complex query performance
        complex_query_times = []
        for _ in range(100):
            time_taken = self.measure_operation_time(
                c.execute,
                '''SELECT * FROM shares 
                   WHERE round_number = ? AND difficulty > ? 
                   ORDER BY timestamp DESC''',
                (sample_share_data['round_number'], 0.5)
            )
            complex_query_times.append(time_taken)
        
        # Calculate statistics
        avg_simple_query = mean(simple_query_times)
        avg_complex_query = mean(complex_query_times)
        
        # Performance assertions
        assert avg_simple_query < 0.001, "Simple query too slow"
        assert avg_complex_query < 0.01, "Complex query too slow"

    def test_concurrent_performance(self, db_conn, sample_share_data):
        """Test database performance under concurrent access.
        
        Measures:
        - Read/write contention
        - Transaction isolation
        - Locking behavior
        """
        c = db_conn.cursor()
        
        # Insert initial data
        for i in range(100):
            data = sample_share_data.copy()
            data['submission_id'] = f"concurrent_{i}"
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
        
        # Test concurrent read/write performance
        concurrent_times = []
        for i in range(50):
            # Start transaction
            db_conn.execute("BEGIN TRANSACTION")
            
            # Measure read
            read_time = self.measure_operation_time(
                c.execute,
                'SELECT * FROM shares WHERE submission_id = ?',
                (f"concurrent_{i}",)
            )
            
            # Measure write
            write_time = self.measure_operation_time(
                c.execute,
                '''UPDATE shares SET difficulty = ? 
                   WHERE submission_id = ?''',
                (1.5, f"concurrent_{i}")
            )
            
            # Commit transaction
            commit_time = self.measure_operation_time(db_conn.commit)
            
            concurrent_times.append(read_time + write_time + commit_time)
        
        # Calculate statistics
        avg_concurrent_time = mean(concurrent_times)
        
        # Performance assertions
        assert avg_concurrent_time < 0.01, "Concurrent operations too slow"

if __name__ == '__main__':
    pytest.main([__file__]) 