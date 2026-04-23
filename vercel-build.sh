#!/bin/bash
set -e
echo "Starting Ascend build..."
echo "Installing dependencies..."
npm install
echo "Building Expo web export..."
npm run export
echo "Build completed successfully!"
ls -la web-build/ | head -20