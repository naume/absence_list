#!/bin/bash
# Simple script to start a local server for testing

echo "🚀 Starting local server..."
echo "📝 The app will open at http://localhost:8080"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3 HTTP server..."
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Using Python HTTP server..."
    python -m http.server 8080
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server . -p 8080 -o
else
    echo "❌ No suitable server found. Please install Python 3 or Node.js"
    echo ""
    echo "To install Node.js: https://nodejs.org/"
    echo "Python 3 usually comes pre-installed on macOS"
    exit 1
fi

