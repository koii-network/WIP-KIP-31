"""Custom assertions for database testing."""

import sqlite3
from typing import Dict, Any, List, Optional

def assert_share_exists(
    conn: sqlite3.Connection,
    share_id: int,
    expected_data: Optional[Dict[str, Any]] = None
) -> None:
    """Assert that a share exists in the database.
    
    Args:
        conn: Database connection
        share_id: ID of the share to check
        expected_data: Optional dictionary of expected share data
    
    Raises:
        AssertionError: If the share doesn't exist or doesn't match expected data
    """
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM shares WHERE id = ?', (share_id,))
    row = cursor.fetchone()
    
    assert row is not None, f"Share with ID {share_id} does not exist"
    
    if expected_data:
        share_data = {
            'id': row[0],
            'submission_id': row[1],
            'difficulty': row[2],
            'timestamp': row[3]
        }
        for key, value in expected_data.items():
            assert share_data[key] == value, \
                f"Share {key} mismatch. Expected: {value}, Got: {share_data[key]}"

def assert_share_count(conn: sqlite3.Connection, expected_count: int) -> None:
    """Assert the total number of shares in the database.
    
    Args:
        conn: Database connection
        expected_count: Expected number of shares
        
    Raises:
        AssertionError: If the count doesn't match expected count
    """
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM shares')
    count = cursor.fetchone()[0]
    assert count == expected_count, \
        f"Share count mismatch. Expected: {expected_count}, Got: {count}"

def assert_share_not_exists(conn: sqlite3.Connection, share_id: int) -> None:
    """Assert that a share does not exist in the database.
    
    Args:
        conn: Database connection
        share_id: ID of the share to check
        
    Raises:
        AssertionError: If the share exists
    """
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM shares WHERE id = ?', (share_id,))
    count = cursor.fetchone()[0]
    assert count == 0, f"Share with ID {share_id} exists when it should not" 