#!/usr/bin/env python3

import os
import sys
import json
import asyncio
import unittest
from unittest.mock import patch, MagicMock

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.btc_wrapper import BTCWrapper

class TestBTCWrapper(unittest.TestCase):
    def setUp(self):
        """Set up test environment."""
        self.config_path = 'config/test_wrapper_config.json'
        self._create_test_config()
        self.wrapper = BTCWrapper(self.config_path)
        
    def _create_test_config(self):
        """Create test configuration file."""
        config = {
            "bitcoin_rpc_url": "http://localhost",
            "bitcoin_rpc_port": 8332,
            "bitcoin_conf_path": "test_bitcoin.conf",
            "k2_rpc_url": "http://localhost:8545",
            "key_file": "test_key.txt",
            "fernet_key_file": "test_fernet_key.txt",
            "wrapper_address": "bc1qtest",
            "min_confirmations": 1,
            "gas_price": 20,
            "gas_limit": 21000,
            "batch_size": 50,
            "retry_attempts": 3,
            "retry_delay": 1,
            "log_level": "INFO"
        }
        os.makedirs('config', exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
            
    @patch('src.btc_wrapper.RawProxy')
    def test_init_bitcoin_rpc(self, mock_rpc):
        """Test Bitcoin RPC initialization."""
        mock_rpc.return_value = MagicMock()
        wrapper = BTCWrapper(self.config_path)
        self.assertIsNotNone(wrapper.btc_rpc)
        
    @patch('web3.Web3')
    def test_init_web3(self, mock_web3):
        """Test Web3 initialization."""
        mock_web3.return_value = MagicMock()
        mock_web3.return_value.is_connected.return_value = True
        wrapper = BTCWrapper(self.config_path)
        self.assertIsNotNone(wrapper.web3)
        
    @patch('src.btc_wrapper.Fernet')
    def test_init_fernet(self, mock_fernet):
        """Test Fernet initialization."""
        mock_fernet.return_value = MagicMock()
        wrapper = BTCWrapper(self.config_path)
        self.assertIsNotNone(wrapper.fernet)
        
    @patch('src.btc_wrapper.Account')
    def test_init_account(self, mock_account):
        """Test account initialization."""
        mock_account.from_key.return_value = MagicMock()
        wrapper = BTCWrapper(self.config_path)
        self.assertIsNotNone(wrapper.account)
        
    @patch('src.btc_wrapper.BTCWrapper._create_bitcoin_tx')
    @patch('src.btc_wrapper.BTCWrapper._wait_for_confirmation')
    @patch('src.btc_wrapper.BTCWrapper._mint_k2_tokens')
    async def test_wrap_rewards(self, mock_mint, mock_wait, mock_create):
        """Test reward wrapping process."""
        mock_create.return_value = "test_txid"
        mock_mint.return_value = "test_k2_tx_hash"
        
        tx_hash = await self.wrapper.wrap_rewards(0.1, "0x123...")
        self.assertEqual(tx_hash, "test_k2_tx_hash")
        
    @patch('src.btc_wrapper.BTCWrapper.wrap_rewards')
    async def test_distribute_rewards(self, mock_wrap):
        """Test reward distribution."""
        mock_wrap.return_value = "test_tx_hash"
        rewards = [
            {'amount': 0.1, 'recipient': '0x123...'},
            {'amount': 0.2, 'recipient': '0x456...'}
        ]
        
        tx_hashes = await self.wrapper.distribute_rewards(rewards)
        self.assertEqual(len(tx_hashes), 2)
        self.assertEqual(tx_hashes[0], "test_tx_hash")
        self.assertEqual(tx_hashes[1], "test_tx_hash")
        
    def tearDown(self):
        """Clean up test environment."""
        if os.path.exists(self.config_path):
            os.remove(self.config_path)
        if os.path.exists('test_bitcoin.conf'):
            os.remove('test_bitcoin.conf')
        if os.path.exists('test_key.txt'):
            os.remove('test_key.txt')
        if os.path.exists('test_fernet_key.txt'):
            os.remove('test_fernet_key.txt')

if __name__ == '__main__':
    unittest.main() 