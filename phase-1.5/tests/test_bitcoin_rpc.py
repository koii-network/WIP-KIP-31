#!/usr/bin/env python3

import os
import sys
import pytest
from pathlib import Path
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException

# Add src directory to path
sys.path.append(str(Path(__file__).parent.parent))

class TestBitcoinRPC:
    @pytest.fixture
    def rpc_connection(self):
        """Create a Bitcoin Core RPC connection."""
        # Use public RPC endpoint
        rpc_url = os.getenv('BITCOIN_RPC_URL', 'https://bitcoin-rpc.publicnode.com')
        return AuthServiceProxy(rpc_url)

    def test_connection(self, rpc_connection):
        """Test basic RPC connection."""
        try:
            # Get blockchain info
            info = rpc_connection.getblockchaininfo()
            assert info is not None
            assert 'chain' in info
            print(f"Connected to Bitcoin {info['chain']} network")
            
            # Get network info
            net_info = rpc_connection.getnetworkinfo()
            assert net_info is not None
            print(f"Bitcoin Core version: {net_info['version']}")
            
        except JSONRPCException as e:
            pytest.fail(f"RPC connection failed: {str(e)}")
            
    def test_mining_functions(self, rpc_connection):
        """Test mining-related RPC functions."""
        try:
            # Get mining info
            mining_info = rpc_connection.getmininginfo()
            assert mining_info is not None
            print(f"Current block height: {mining_info['blocks']}")
            
            # Test getblocktemplate
            template = rpc_connection.getblocktemplate({'rules': ['segwit']})
            assert template is not None
            print("Successfully retrieved block template")
                    
        except JSONRPCException as e:
            pytest.fail(f"Mining test failed: {str(e)}")

if __name__ == '__main__':
    pytest.main([__file__]) 