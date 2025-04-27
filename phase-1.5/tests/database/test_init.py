#!/usr/bin/env python3

import os
import sys
import sqlite3
import pytest
import tempfile
import shutil
from pathlib import Path

# Add src directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

class TestDatabaseInitialization:
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def db_path(self, temp_dir):
        """Return path to test database."""
        return os.path.join(temp_dir, 'test_shares.db')

    def test_database_creation(self, db_path):
        """Test basic database creation."""
        # Create database
        conn = sqlite3.connect(db_path)
        assert os.path.exists(db_path), "Database file was not created"
        
        # Verify table creation
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
        
        # Verify table exists
        c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='shares'")
        result = c.fetchone()
        assert result is not None, "Shares table was not created"
        assert result[0] == 'shares', "Incorrect table name"
        
        conn.close()

    def test_table_schema(self, db_path):
        """Test table schema is correct."""
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
        
        # Get table info
        c.execute("PRAGMA table_info(shares)")
        columns = c.fetchall()
        
        # Verify column names and types
        expected_columns = [
            (0, 'id', 'INTEGER', 0, None, 1),  # notnull is 0 for PRIMARY KEY AUTOINCREMENT
            (1, 'round_number', 'INTEGER', 0, None, 0),
            (2, 'timestamp', 'INTEGER', 0, None, 0),
            (3, 'hash', 'TEXT', 0, None, 0),
            (4, 'difficulty', 'REAL', 0, None, 0),
            (5, 'valid', 'INTEGER', 0, None, 0),
            (6, 'block_height', 'INTEGER', 0, None, 0),
            (7, 'worker_id', 'TEXT', 0, None, 0),
            (8, 'submission_id', 'TEXT', 0, None, 0)
        ]
        
        for i, (cid, name, type_, notnull, dflt_value, pk) in enumerate(columns):
            assert (cid, name, type_, notnull, dflt_value, pk) == expected_columns[i], \
                f"Column {name} does not match expected schema"
        
        conn.close()

    def test_permissions(self, db_path):
        """Test database file permissions."""
        # Create database
        conn = sqlite3.connect(db_path)
        conn.close()
        
        # Check file permissions
        mode = os.stat(db_path).st_mode
        assert mode & 0o777 == 0o644, "Incorrect file permissions"

if __name__ == '__main__':
    pytest.main([__file__]) 