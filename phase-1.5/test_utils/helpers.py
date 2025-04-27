"""Helper functions for database testing."""

import sqlite3
from typing import List, Dict, Any, Optional

def create_test_database(db_path: str) -> sqlite3.Connection:
    """Create a test database and return the connection.
    
    Args:
        db_path: Path to the test database file
        
    Returns:
        sqlite3.Connection: Database connection object
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create shares table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id TEXT NOT NULL,
            difficulty REAL NOT NULL,
            timestamp INTEGER NOT NULL
        )
    ''')
    conn.commit()
    return conn

def insert_test_data(conn: sqlite3.Connection, data: List[Dict[str, Any]]) -> None:
    """Insert test data into the database.
    
    Args:
        conn: Database connection
        data: List of dictionaries containing share data
    """
    cursor = conn.cursor()
    for item in data:
        cursor.execute(
            'INSERT INTO shares (submission_id, difficulty, timestamp) VALUES (?, ?, ?)',
            (item['submission_id'], item['difficulty'], item['timestamp'])
        )
    conn.commit()

def get_share_by_id(conn: sqlite3.Connection, share_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a share by its ID.
    
    Args:
        conn: Database connection
        share_id: ID of the share to retrieve
        
    Returns:
        Optional[Dict[str, Any]]: Share data if found, None otherwise
    """
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM shares WHERE id = ?', (share_id,))
    row = cursor.fetchone()
    
    if row:
        return {
            'id': row[0],
            'submission_id': row[1],
            'difficulty': row[2],
            'timestamp': row[3]
        }
    return None 