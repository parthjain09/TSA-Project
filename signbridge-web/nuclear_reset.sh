#!/bin/bash
echo "🚀 SignBridge Nuclear Reset 🚀"
echo "------------------------------"

echo "1. Killing any 'ghost' Vite or Electron processes..."
pkill -f vite || true
pkill -f electron || true
pkill -f "SignBridge Tutor" || true

echo "2. Cleaning local caches..."
rm -rf node_modules/.vite || true
rm -rf dist || true
rm -rf release || true

echo "3. Re-installing dependencies (just in case)..."
npm install --no-audit

echo "------------------------------"
echo "✅ CLEANUP COMPLETE."
echo "👉 Now run: npm run electron:dev"
echo "------------------------------"
