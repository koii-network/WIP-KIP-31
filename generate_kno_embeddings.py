#!/usr/bin/env python3
"""
Script to generate KNO SDK embeddings database for the BTC-Koii repository.
This creates a .kno/ directory with semantic embeddings for code search and analysis.
"""

import os
import sys
import time
import json
import shutil
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("kno-embeddings")

# Flag to determine if we're using the simple implementation
USING_SIMPLE = True

try:
    # Try importing from kno_sdk package
    from kno_sdk import clone_and_index, EmbeddingMethod
    logger.info("Using installed kno-sdk package")
    USING_SIMPLE = False
except ImportError:
    try:
        # Try importing from local simple_kno.py
        sys.path.insert(0, str(Path(__file__).parent.absolute()))
        from simple_kno import clone_and_index, EmbeddingMethod
        logger.warning("Using simple_kno.py fallback (limited functionality)")
        USING_SIMPLE = True
    except ImportError:
        logger.error("Neither kno-sdk nor simple_kno.py found. Please install kno-sdk with: pip install kno-sdk")
        sys.exit(1)
    
def create_basic_kno_structure(repo_dir, branch):
    """
    Create a basic .kno/ directory structure without requiring the full kno-sdk.
    This is a very simplified version just to make the project compatible with the KNO SDK.
    
    Args:
        repo_dir: Repository root directory
        branch: Git branch name
    """
    kno_dir = repo_dir / ".kno"
    
    # Create the .kno directory if it doesn't exist
    if not kno_dir.exists():
        kno_dir.mkdir()
        logger.info(f"Created .kno directory at {kno_dir}")
    
    # Get timestamp and create SBERT embedding directory
    timestamp = int(time.time() * 1000)
    commit_id = "local"  # Default placeholder
    
    # Try to get actual commit ID
    try:
        import subprocess
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True
        )
        commit_id = result.stdout.strip()
    except Exception as e:
        logger.warning(f"Could not determine commit ID: {e}")
    
    # Create subdirectory for embeddings
    embed_dir = kno_dir / f"embedding_SBERTEmbedding_{timestamp}_{commit_id}"
    embed_dir.mkdir(exist_ok=True)
    
    # Create a basic chroma.sqlite3 file
    with open(embed_dir / "chroma.sqlite3", "w") as f:
        f.write("-- KNO SDK placeholder database")
    
    # Create a simple metadata JSON file
    metadata = {
        "repo": os.path.basename(repo_dir),
        "branch": branch,
        "timestamp": timestamp,
        "commit": commit_id,
        "embedding_method": "SBERTEmbedding",
        "description": "Basic KNO SDK placeholder database"
    }
    
    with open(embed_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Created basic KNO structure at {embed_dir}")
    return embed_dir

def main():
    # Get the repository root directory
    repo_dir = Path(__file__).parent.absolute()
    repo_url = None  # Will be determined from git remote

    # Determine the repo URL from git remote if possible
    try:
        import subprocess
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True
        )
        repo_url = result.stdout.strip()
        logger.info(f"Detected repository URL: {repo_url}")
    except Exception as e:
        logger.warning(f"Could not determine repository URL from git: {e}")
        # Fallback to a placeholder URL
        repo_url = "https://github.com/user/btc-koii"
        logger.info(f"Using placeholder repository URL: {repo_url}")

    # Determine current branch
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True
        )
        branch = result.stdout.strip()
        logger.info(f"Current branch: {branch}")
    except Exception:
        branch = "main"
        logger.info(f"Could not determine current branch, using: {branch}")

    logger.info("Starting KNO SDK indexing process...")
    try:
        if USING_SIMPLE:
            # Create a basic KNO directory structure manually
            logger.warning("Using basic KNO structure creation (no actual embeddings)")
            embed_dir = create_basic_kno_structure(repo_dir, branch)
            
            # Also run the simple_kno.py implementation as a fallback
            repo_index = clone_and_index(
                repo_url=repo_url,
                branch=branch,
                embedding=EmbeddingMethod.SBERT,
                cloned_repo_base_dir=str(repo_dir.parent)
            )
            
            logger.info(f"Basic KNO structure created at: {repo_dir / '.kno'}")
            logger.info(f"Mock repository index digest:\n{repo_index.digest}")
            logger.warning("This is a basic KNO structure with no real embeddings.")
            logger.warning("To create a real index with embeddings, install the full kno-sdk package.")
        else:
            # Using full kno-sdk package
            # Note: should_push_to_repo is set to False to avoid automatic pushing
            repo_index = clone_and_index(
                repo_url=repo_url,
                branch=branch,
                embedding=EmbeddingMethod.SBERT,
                cloned_repo_base_dir=str(repo_dir.parent),
                should_reindex=True,
                should_push_to_repo=False
            )
            
            logger.info(f"Repository indexed successfully at: {repo_index.path}")
            logger.info(f"KNO directory: {repo_index.path / '.kno'}")
            logger.info(f"Repository structure digest:\n{repo_index.digest}")
            
            # Count the number of embeddings
            try:
                collection_count = repo_index.vector_store._collection.count()
                logger.info(f"Created {collection_count} embeddings")
            except Exception as e:
                logger.warning(f"Could not determine embedding count: {e}")
                
    except Exception as e:
        logger.error(f"Error during indexing: {e}")
        sys.exit(1)
        
    logger.info("Indexing complete! You can now use kno-sdk to search and analyze this codebase.")
    logger.info("Example: python -c \"from kno_sdk import search; print(search(repo_url='path/to/repo', query='mining'))\"")

if __name__ == "__main__":
    main()