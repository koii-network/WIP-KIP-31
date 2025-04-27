"""Constants used in database testing."""

# Database configuration
TEST_DB_PATH = "test_shares.db"

# Test data constants
DEFAULT_SUBMISSION_ID = "test_submission_default"
DEFAULT_DIFFICULTY = 1.0
SAMPLE_DIFFICULTIES = [1.0, 2.0, 3.0, 4.0, 5.0]
SAMPLE_SUBMISSION_IDS = [
    "test_submission_1",
    "test_submission_2",
    "test_submission_3",
    "test_submission_4",
    "test_submission_5"
]

# Time constants
TIMESTAMP_TOLERANCE = 5  # seconds
DEFAULT_TEST_DURATION = 10  # seconds

# Database table schema
SHARES_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id TEXT NOT NULL,
    difficulty REAL NOT NULL,
    timestamp INTEGER NOT NULL
)
""" 