#!/bin/bash

# Exit on error
set -e

# Configuration
TEST_DIR="tests"
COVERAGE_DIR="coverage"
REPORT_DIR="reports"

# Create directories
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORT_DIR"

# Install test dependencies
echo "Installing test dependencies..."
pip install -r tests/requirements.txt

# Run tests with coverage
echo "Running tests..."
pytest \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=html:$COVERAGE_DIR \
    --junitxml=$REPORT_DIR/junit.xml \
    --html=$REPORT_DIR/report.html \
    -v \
    "$TEST_DIR"

# Check test results
if [ $? -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Some tests failed. Check the reports in $REPORT_DIR"
    exit 1
fi 