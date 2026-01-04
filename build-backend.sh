#!/bin/bash

# Script to build sequb-server backend and copy it to Tauri binaries folder

set -e

echo "Building sequb-server backend..."

# Navigate to backend project
BACKEND_DIR="../sequb-protocol"
CURRENT_DIR=$(pwd)

cd "$BACKEND_DIR"

# Build the backend - use debug mode for faster builds in development
echo "Running cargo build (debug mode for faster builds)..."
cargo build --bin sequb-server

# Create binaries directory if it doesn't exist
cd "$CURRENT_DIR"
mkdir -p src-tauri/binaries

# Detect OS and copy appropriate binary
OS=$(uname -s)
case "$OS" in
    Linux*)
        echo "Copying Linux binary..."
        cp "$BACKEND_DIR/target/debug/sequb-server" "src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu"
        chmod +x "src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu"
        ;;
    Darwin*)
        echo "Copying macOS binary..."
        cp "$BACKEND_DIR/target/debug/sequb-server" "src-tauri/binaries/sequb-server-x86_64-apple-darwin"
        chmod +x "src-tauri/binaries/sequb-server-x86_64-apple-darwin"
        ;;
    MINGW*|MSYS*|CYGWIN*|Windows*)
        echo "Copying Windows binary..."
        cp "$BACKEND_DIR/target/debug/sequb-server.exe" "src-tauri/binaries/sequb-server-x86_64-pc-windows-msvc.exe"
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

echo "Backend build complete!"
echo "You can now run 'npm run tauri dev' to start the application with the backend"