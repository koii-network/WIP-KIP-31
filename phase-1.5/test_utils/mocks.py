"""Mock objects and data for testing."""

import time
from typing import Dict, Any, List

def create_mock_share(
    submission_id: str = "test_submission",
    difficulty: float = 1.0,
    timestamp: int = None
) -> Dict[str, Any]:
    """Create a mock share entry.
    
    Args:
        submission_id: Share submission ID
        difficulty: Share difficulty
        timestamp: Share timestamp (defaults to current time)
        
    Returns:
        Dict[str, Any]: Mock share data
    """
    if timestamp is None:
        timestamp = int(time.time())
        
    return {
        'submission_id': submission_id,
        'difficulty': difficulty,
        'timestamp': timestamp
    }

def create_mock_shares(count: int = 5) -> List[Dict[str, Any]]:
    """Create multiple mock share entries.
    
    Args:
        count: Number of mock shares to create
        
    Returns:
        List[Dict[str, Any]]: List of mock share data
    """
    base_time = int(time.time())
    return [
        create_mock_share(
            submission_id=f"test_submission_{i}",
            difficulty=float(i + 1),
            timestamp=base_time + i
        )
        for i in range(count)
    ]

class MockDatabaseError(Exception):
    """Mock database error for testing error handling."""
    pass 