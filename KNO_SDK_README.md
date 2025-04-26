# KNO SDK Integration

This project is designed to work with KNO SDK to enable semantic code search and analysis. This document explains what KNO SDK is and how to use it with this project.

## What is KNO SDK?

KNO SDK is a Python library for cloning, indexing, and semantically searching Git repositories using embeddings (OpenAI or SBERT) and Chroma. It also provides a high-level agent query functionality for autonomous code analysis.

Key features:
- Semantic code chunk extraction with Tree-Sitter
- Vector-based search using embeddings
- Autonomous code analysis with LLMs
- Knowledge persistence in `.kno/` directories

## Installation

To use KNO SDK with this project:

```bash
pip install kno-sdk
```

This project comes with helper files to facilitate KNO integration:
- **Example Script**: `/example_kno.py` demonstrates basic usage
- **Simplified Module**: `/simple_kno.py` provides a stripped-down version for environments where the full dependency stack can't be installed

## Usage

To use KNO SDK with this project:

### Basic Example

```python
from kno_sdk import clone_and_index, search, EmbeddingMethod

# Index this repository
repo_index = clone_and_index(
    repo_url="https://github.com/[your-username]/btc-koii",
    branch="main",
    embedding=EmbeddingMethod.SBERT
)

# Search the indexed repository
results = search(
    repo_url="https://github.com/[your-username]/btc-koii",
    branch="main",
    embedding=EmbeddingMethod.SBERT,
    query="mining share collection",
    k=5
)

# Print results
for i, chunk in enumerate(results, 1):
    print(f"--- Result #{i} ---\n{chunk}\n")
```

### Agent Queries

For AI-assisted code analysis:

```python
from kno_sdk import agent_query, EmbeddingMethod, LLMProvider

result = agent_query(
    repo_url="https://github.com/[your-username]/btc-koii",
    branch="main",
    embedding=EmbeddingMethod.SBERT,
    llm_provider=LLMProvider.ANTHROPIC,
    llm_model="claude-3-haiku-20240307",
    prompt="Explain how mining shares are collected and validated in this project",
    MODEL_API_KEY="your_api_key_here"
)

print(result)
```

The agent will:
1. Clone and index the repository
2. Use tools like search_code and read_file
3. Analyze code patterns and documentation
4. Generate a detailed explanation based on its findings

## KNO SDK in BTC-Koii Project

The BTC-Koii project leverages KNO SDK for several key use cases:

1. **Mining Algorithm Analysis**: Using semantic code search to understand mining algorithms and protocol implementations
2. **Share Verification Logic**: Helping contributors understand the share verification process and audit mechanisms
3. **Integration Documentation**: Streamlining documentation generation and maintenance
4. **Onboarding**: Enabling new developers to quickly find relevant code patterns
5. **Code Navigation**: Making it easier to work with the multi-phase implementation structure

The `.kno/` directory in this repository will store embeddings for easier search and access, particularly helpful when navigating between different implementation phases of the Bitcoin mining pool.

## Further Documentation

For more information on the full capabilities of the KNO SDK, see the original repository at:
https://github.com/Prometheus-Swarm/kno-sdk