#!/bin/bash

# Quick test script to verify frontend-backend integration readiness

echo "Testing Frontend-Backend Integration Setup"
echo "=========================================="

# Check if backend binary exists
echo "1. Checking backend binary..."
if [ -f "src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu" ]; then
    echo "✓ Backend binary found"
    ls -lh src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu
else
    echo "✗ Backend binary not found"
    exit 1
fi

# Check if frontend builds
echo ""
echo "2. Checking frontend build..."
if npm run build > /dev/null 2>&1; then
    echo "✓ Frontend builds successfully"
else
    echo "✗ Frontend build failed"
    exit 1
fi

# Check API endpoints are configured
echo ""
echo "3. Checking API configuration..."
if grep -q "http://localhost:3000" src/lib/api.ts; then
    echo "✓ API configured for port 3000"
else
    echo "✗ API configuration missing"
fi

# Check Tauri configuration
echo ""
echo "4. Checking Tauri configuration..."
if grep -q "sequb-server" src-tauri/tauri.conf.json; then
    echo "✓ Tauri configured with sidecar"
else
    echo "✗ Tauri sidecar configuration missing"
fi

echo ""
echo "=========================================="
echo "Integration setup complete!"
echo ""
echo "Note: The backend has a database initialization issue that needs to be fixed."
echo "The issue is in sequb-server/src/state.rs where it tries to create a second database connection."
echo ""
echo "To test the frontend standalone:"
echo "  npm run dev"
echo ""
echo "To test with Tauri (will show backend errors):"
echo "  npm run tauri dev"