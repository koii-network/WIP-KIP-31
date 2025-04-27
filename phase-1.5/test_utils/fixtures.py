#!/usr/bin/env python3

import os
import tempfile
import shutil
import pytest
import time
from pathlib import Path

@pytest.fixture
def temp_dir():
    """Create a temporary directory for testing."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir)

@pytest.fixture
def test_db_path(tmp_path):
    """Create a temporary database path."""
    db_path = str(tmp_path / "test_shares.db")
    yield db_path
    if os.path.exists(db_path):
        os.remove(db_path)

@pytest.fixture
def test_log_dir(temp_dir):
    """Return path to test log directory."""
    log_dir = os.path.join(temp_dir, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    return log_dir

@pytest.fixture
def test_config():
    """Return test configuration."""
    return {
        'PORT': 8085,
        'LOG_LEVEL': 'INFO',
        'DB_PATH': 'data/shares.db',
        'WORKERS': 4,
        'TIMEOUT': 120
    }

@pytest.fixture
def sample_share_data():
    """Create sample share data for testing."""
    return {
        'round_number': 1,
        'timestamp': int(time.time()),
        'hash': '0000000000000000000000000000000000000000000000000000000000000000',
        'difficulty': 1.0,
        'valid': True,
        'block_height': 1,
        'worker_id': 'test_worker',
        'submission_id': 'test_submission'
    } 