# Sequb UI

Desktop shell for Sequb - a visual workflow automation platform built with Tauri v2 and React.

## Architecture

Sequb UI is a **Server-Driven UI (SDUI)** that acts as a visual client for the locally running `sequb-server`. The frontend dynamically renders nodes based on a registry fetched from the backend, enabling plugin support without recompiling the UI.

## Prerequisites

- Node.js 18+
- Rust (for Tauri)
- `sequb-server` binary from the [sequb-protocol](https://github.com/svailsa/sequb-protocol) repo

## Setup

1. **Build the backend server:**
   ```bash
   cd ../sequb-protocol
   cargo build --release --bin sequb-server
   ```

2. **Copy the server binary to the UI project:**
   ```bash
   # Linux/Mac
   cp ../sequb-protocol/target/release/sequb-server src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu
   
   # Windows
   cp ../sequb-protocol/target/release/sequb-server.exe src-tauri/binaries/sequb-server-x86_64-pc-windows-msvc.exe
   
   # macOS
   cp ../sequb-protocol/target/release/sequb-server src-tauri/binaries/sequb-server-x86_64-apple-darwin
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

## Development

### Run in development mode:

**Option 1: Integrated Mode (Recommended)**
```bash
npm run tauri:dev
```
This starts both the React dev server and Tauri with the sidecar server.

**Option 2: Separate Processes (For debugging)**

Terminal 1 - Backend:
```bash
cd ../sequb-protocol
cargo run --bin sequb-server
```

Terminal 2 - Frontend:
```bash
npm run dev
```

Terminal 3 - Tauri (optional, for native features):
```bash
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

This creates a distributable package with the embedded server binary.

## Project Structure

```
sequb-ui/
├── src-tauri/          # Tauri backend (Rust)
│   ├── binaries/       # Sequb server binaries
│   └── src/main.rs     # Sidecar lifecycle management
├── src/
│   ├── features/       # Feature modules
│   │   ├── canvas/     # Graph canvas with ReactFlow
│   │   └── properties/ # Dynamic property panels
│   ├── lib/            # API client and utilities
│   ├── stores/         # Zustand state management
│   └── types/          # TypeScript definitions
```

## Key Features

- **Server-Driven UI:** Nodes are dynamically rendered based on backend registry
- **Sidecar Management:** Automatic spawning and lifecycle management of backend server
- **Visual Workflow Editor:** Drag-and-drop node graph interface
- **Plugin Support:** Extend functionality through WASM plugins without UI changes
- **Real-time Execution:** Execute workflows and monitor progress

## API Integration

The frontend expects the following endpoints from `sequb-server`:

- `GET /api/v1/health` - Health check
- `GET /api/v1/nodes/registry` - Node definitions for SDUI
- `GET/POST /api/v1/workflows` - Workflow CRUD operations
- `POST /api/v1/workflows/{id}/execute` - Execute workflows
- `GET /api/v1/executions/{id}` - Execution status

## License

See LICENSE in the root repository.
