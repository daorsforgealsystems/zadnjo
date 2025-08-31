#!/usr/bin/env bash
# Minimal helper to create a venv and install requirements for the inventory service
set -euo pipefail
PYTHON=${PYTHON:-python3}
if ! command -v "$PYTHON" &>/dev/null; then
  echo "Python not found: $PYTHON"
  exit 1
fi
python_version=$($PYTHON -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Using Python $python_version"
python -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Virtualenv created at .venv and requirements installed. Activate with: source .venv/bin/activate"
