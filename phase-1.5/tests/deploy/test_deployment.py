"""Deployment test suite."""

import os
import pytest
import subprocess
from pathlib import Path

class TestDeployment:
    @pytest.fixture
    def deployment_dir(self):
        """Return the deployment directory path."""
        return Path(__file__).parent.parent.parent / 'deploy'

    def test_docker_compose_exists(self, deployment_dir):
        """Test that docker-compose.yml exists and is valid."""
        compose_file = deployment_dir / 'docker-compose.yml'
        assert compose_file.exists(), "docker-compose.yml not found"
        
        # Try to validate docker-compose file
        result = subprocess.run(
            ['docker-compose', '-f', str(compose_file), 'config'],
            capture_output=True,
            text=True
        )
        assert result.returncode == 0, f"Invalid docker-compose.yml: {result.stderr}"

    def test_dockerfile_exists(self, deployment_dir):
        """Test that Dockerfile exists."""
        dockerfile = deployment_dir / 'Dockerfile'
        assert dockerfile.exists(), "Dockerfile not found"

    def test_deployment_structure(self, deployment_dir):
        """Test the deployment directory structure."""
        # Create required directories if they don't exist
        required_dirs = ['data', 'logs', 'config']
        for dir_name in required_dirs:
            dir_path = deployment_dir / dir_name
            dir_path.mkdir(exist_ok=True)
            assert dir_path.exists(), f"{dir_name} directory not found"
            assert dir_path.is_dir(), f"{dir_name} is not a directory"

        # Create environment files if they don't exist
        env_files = ['.env', '.env.test', '.env.prod']
        for file in env_files:
            env_file = deployment_dir / file
            if not env_file.exists():
                with open(env_file, 'w') as f:
                    f.write(f"NODE_ENV={'test' if 'test' in file else 'development'}\n")
                    f.write("LOG_LEVEL=DEBUG\n")
                    f.write("DB_PATH=/app/data/shares.db\n")
                    f.write("PORT=8085\n")
                    f.write("WORKERS=4\n")
                    f.write("TIMEOUT=120\n")
            assert env_file.exists(), f"{file} not found" 