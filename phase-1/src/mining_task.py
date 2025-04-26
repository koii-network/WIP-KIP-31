#!/usr/bin/env python3

import os
import sys
import time
import json
import logging
import sqlite3
import requests
from flask import Flask, jsonify, request
from prometheus_client import start_http_server, Counter, Gauge
import psutil

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/mining_task.log'),
        logging.StreamHandler()
    ]
)

# Global state
startup_time = time.time()
current_round = 0
health_status = {
    'miner': False,
    'metrics': False,
    'api': False,
    'share_collection': False
}

# Prometheus metrics
hash_rate = Gauge('miner_hash_rate', 'Current hash rate in H/s')
cpu_usage = Gauge('miner_cpu_usage', 'CPU usage percentage')
memory_usage = Gauge('miner_memory_usage', 'Memory usage in MB')
shares_submitted = Counter('miner_shares_submitted', 'Total shares submitted')
valid_shares = Counter('miner_valid_shares', 'Total valid shares')
invalid_shares = Counter('miner_invalid_shares', 'Total invalid shares')
round_number = Gauge('mining_round', 'Current mining round number')

def init_db():
    try:
        conn = sqlite3.connect('data/shares.db')
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
        conn.commit()
        conn.close()
        logging.info("Database initialized successfully")
        health_status['share_collection'] = True
    except Exception as e:
        logging.error(f"Error initializing database: {e}")
        sys.exit(1)

def store_share(round_num, hash_value, difficulty, valid, block_height, worker_id, submission_id):
    try:
        conn = sqlite3.connect('data/shares.db')
        c = conn.cursor()
        c.execute('''INSERT INTO shares 
                     (round_number, timestamp, hash, difficulty, valid, block_height, worker_id, submission_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                  (round_num, int(time.time()), hash_value, difficulty, valid, block_height, worker_id, submission_id))
        conn.commit()
        conn.close()
        logging.info(f"Share stored for round {round_num}: {hash_value[:8]}...")
        return True
    except Exception as e:
        logging.error(f"Error storing share: {e}")
        return False

@app.route('/task/<int:round_number>', methods=['GET'])
def get_task(round_number):
    try:
        # Return task parameters with default values
        return jsonify({
            'round_number': round_number,
            'target_difficulty': 1.0,
            'hash_rate': hash_rate._value.get() if hasattr(hash_rate, '_value') else 0,
            'valid_shares': valid_shares._value.get() if hasattr(valid_shares, '_value') else 0,
            'invalid_shares': invalid_shares._value.get() if hasattr(invalid_shares, '_value') else 0
        })
    except Exception as e:
        logging.error(f"Error getting task: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/submission/<int:round_number>', methods=['POST'])
def submit_share(round_number):
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate submission
        required_fields = ['hash', 'difficulty', 'block_height', 'worker_id', 'submission_id']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Store share
        success = store_share(
            round_number,
            data['hash'],
            data['difficulty'],
            data.get('valid', True),
            data['block_height'],
            data['worker_id'],
            data['submission_id']
        )
        
        if not success:
            return jsonify({'error': 'Failed to store share'}), 500
        
        # Update metrics
        shares_submitted.inc()
        if data.get('valid', True):
            valid_shares.inc()
        else:
            invalid_shares.inc()
        
        return jsonify({'status': 'success'})
    except Exception as e:
        logging.error(f"Error submitting share: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/audit', methods=['GET'])
def audit():
    try:
        conn = sqlite3.connect('data/shares.db')
        c = conn.cursor()
        
        # Get audit statistics
        c.execute('''SELECT 
                     COUNT(*) as total_shares,
                     SUM(CASE WHEN valid = 1 THEN 1 ELSE 0 END) as valid_shares,
                     SUM(CASE WHEN valid = 0 THEN 1 ELSE 0 END) as invalid_shares,
                     COUNT(DISTINCT worker_id) as unique_workers
                     FROM shares''')
        stats = c.fetchone()
        
        # Get recent shares
        c.execute('''SELECT * FROM shares 
                     ORDER BY timestamp DESC 
                     LIMIT 10''')
        recent_shares = c.fetchall()
        
        conn.close()
        
        return jsonify({
            'statistics': {
                'total_shares': stats[0],
                'valid_shares': stats[1],
                'invalid_shares': stats[2],
                'unique_workers': stats[3]
            },
            'recent_shares': recent_shares
        })
    except Exception as e:
        logging.error(f"Error performing audit: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/healthz', methods=['GET'])
def health():
    # Update health status based on current state
    health_status['api'] = True
    health_status['metrics'] = True
    health_status['miner'] = True  # Assuming miner is running
    
    return jsonify({
        'status': 'healthy' if all(health_status.values()) else 'unhealthy',
        'components': health_status,
        'uptime': time.time() - startup_time
    })

def monitor_resources():
    while True:
        try:
            cpu_usage.set(psutil.cpu_percent())
            memory_usage.set(psutil.Process().memory_info().rss / 1024 / 1024)
            time.sleep(1)
        except Exception as e:
            logging.error(f"Error monitoring resources: {e}")
            time.sleep(1)

if __name__ == '__main__':
    try:
        # Initialize database
        init_db()
        
        # Start Prometheus metrics server
        start_http_server(8082)
        health_status['metrics'] = True
        logging.info("Started metrics server")
        
        # Start resource monitoring in background
        import threading
        monitor_thread = threading.Thread(target=monitor_resources, daemon=True)
        monitor_thread.start()
        logging.info("Started resource monitoring")
        
        # Start Flask app
        health_status['api'] = True
        port = int(os.environ.get('PORT', 8080))
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logging.error(f"Error in main: {e}")
        sys.exit(1) 