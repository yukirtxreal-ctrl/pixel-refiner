#!/bin/bash
cd "$(dirname "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org/ (or run: brew install node), then run this again."
  read -n 1 -s -r -p "Press any key to close..."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run, this can take a minute)..."
  if ! npm install; then
    echo "npm install failed. Check the error above, then run this again."
    read -n 1 -s -r -p "Press any key to close..."
    exit 1
  fi
fi
echo "Starting Pixel Refiner at http://localhost:5173 ... keep this window open; close it to stop."
npm run dev
