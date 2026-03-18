#!/bin/bash
echo "========================================"
echo "   AgriGuard AI - First Time Setup"
echo "========================================"

if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js not found."
  echo "Install from https://nodejs.org then run this again."
  exit 1
fi
echo "Node.js found: $(node --version)"

cd backend
npm install
if [ $? -ne 0 ]; then
  echo "npm install failed. Trying with build flags..."
  npm install --build-from-source better-sqlite3
fi
cd ..

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo ""
  echo "IMPORTANT: Open backend/.env and add your API key."
  echo "Get a FREE key from: https://aistudio.google.com"
fi

chmod +x start.sh
echo ""
echo "========================================"
echo "Setup complete! Now:"
echo "1. Open backend/.env and paste your key"
echo "2. Run: ./start.sh"
echo "========================================"
