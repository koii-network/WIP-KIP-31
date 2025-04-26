#!/usr/bin/env python3
"""
Example script for using kno-sdk with the BTC-Koii project
"""

try:
    from kno_sdk import clone_and_index, search, EmbeddingMethod, agent_query, LLMProvider
    KNO_AVAILABLE = True
except ImportError:
    from simple_kno import clone_and_index, search, EmbeddingMethod, agent_query, LLMProvider
    KNO_AVAILABLE = False

def main():
    print("BTC-Koii KNO SDK Example")
    print("=" * 25)
    
    if KNO_AVAILABLE:
        print("✅ kno-sdk is properly installed")
    else:
        print("⚠️  Using simple_kno fallback module (limited functionality)")
        print("   To install the full SDK: pip install kno-sdk")
    
    print("\nExample usage for BTC-Koii project:")
    print("\n# Index the BTC-Koii repository")
    print("repo_index = clone_and_index(")
    print("    repo_url=\"https://github.com/your-username/btc-koii\",")
    print("    branch=\"main\",")
    print("    embedding=EmbeddingMethod.SBERT")
    print(")")
    
    print("\n# Search for mining-related code")
    print("results = search(")
    print("    repo_url=\"https://github.com/your-username/btc-koii\",")
    print("    query=\"bitcoin mining share collection\",")
    print("    k=5")
    print(")")
    
    print("\nFor more information, see KNO_SDK_README.md")

if __name__ == "__main__":
    main()