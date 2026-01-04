# Sequb UI - Backend Integration Guide

This document explains how to integrate the Sequb UI frontend with the sequb-protocol backend.

## Prerequisites

1. Both projects cloned:
   - Frontend: `/home/mark/Projects/sequb/sequb-ui`
   - Backend: `/home/mark/Projects/sequb/sequb-protocol`

2. Rust toolchain installed for building the backend
3. Node.js and npm installed for the frontend

## Integration Steps

### Option 1: Run Backend Separately (Development)

1. **Start the backend server:**
   ```bash
   cd /home/mark/Projects/sequb/sequb-protocol
   cargo run --bin sequb-server
   ```
   The backend will start on port 3000 by default.

2. **Start the frontend in development mode:**
   ```bash
   cd /home/mark/Projects/sequb/sequb-ui
   npm run dev
   ```
   The frontend will connect to the backend on localhost:3000.

### Option 2: Integrated with Tauri (Production-like)

1. **Build the backend binary:**
   ```bash
   cd /home/mark/Projects/sequb/sequb-ui
   ./build-backend.sh
   ```
   This script will:
   - Build the sequb-server binary
   - Copy it to `src-tauri/binaries/` with the correct platform-specific name

2. **Run the Tauri application:**
   ```bash
   npm run tauri dev
   ```
   Tauri will automatically:
   - Launch the backend as a sidecar process
   - Find a free port dynamically
   - Pass the port to the frontend
   - Manage the backend lifecycle

### Option 3: Build for Production

1. **Build backend:**
   ```bash
   ./build-backend.sh
   ```

2. **Build Tauri app:**
   ```bash
   npm run tauri build
   ```
   This creates a distributable application with the backend bundled.

## Architecture

### Frontend-Backend Communication

- **API Base URL:** `http://localhost:3000` (or dynamic port when using Tauri)
- **Authentication:** Currently disabled for development
- **CORS:** Enabled on backend for development

### Available Endpoints

The frontend is configured to use these backend endpoints:

#### Health Check
- `GET /health` - Check server status

#### Workflows
- `GET /workflows` - List all workflows
- `POST /workflows` - Create new workflow
- `GET /workflows/{id}` - Get workflow details
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow
- `GET /workflows/{id}/graph` - Get workflow graph
- `PUT /workflows/{id}/graph` - Update workflow graph
- `POST /workflows/{id}/execute` - Execute workflow
- `POST /workflows/{id}/activate` - Activate workflow
- `POST /workflows/{id}/pause` - Pause workflow
- `POST /workflows/{id}/archive` - Archive workflow
- `POST /workflows/{id}/clone` - Clone workflow

#### Executions
- `GET /executions/{id}` - Get execution status
- `POST /executions/{id}/cancel` - Cancel execution
- `POST /executions/{id}/approve` - Approve manual step

#### Plugins
- `GET /plugins` - List plugins
- `POST /plugins` - Load plugin
- `DELETE /plugins/{id}` - Unload plugin

### Node Types

The UI supports these node types from the backend:

1. **LLM Node** - AI/LLM processing
2. **HTTP Node** - HTTP requests
3. **Trigger Node** - Workflow entry point
4. **Condition Node** - Conditional branching
5. **Transform Node** - Data transformation
6. **Delay Node** - Time delays

### Mock Registry

Since the backend doesn't have a registry endpoint yet, the frontend includes mock node definitions in `/src/lib/api.ts`.

## Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Ensure all Rust dependencies are installed: `cd sequb-protocol && cargo build`

### Frontend can't connect to backend
- Verify backend is running on the expected port
- Check browser console for CORS errors
- Ensure CSP headers allow localhost connections

### Tauri sidecar issues
- Check that the binary exists in `src-tauri/binaries/`
- Verify binary has execute permissions: `chmod +x src-tauri/binaries/*`
- Check Tauri logs for sidecar output

## Security Considerations

The integration includes several security features:

1. **Binary Integrity Verification** - Hashes checked in production builds
2. **Dynamic Port Allocation** - Prevents port conflicts
3. **CSP Headers** - Restrictive content security policy
4. **Input Validation** - All user inputs sanitized
5. **Secure IPC** - Type-safe Tauri command interface

## Development Workflow

1. Make changes to backend in `sequb-protocol`
2. Rebuild backend: `cargo build --release --bin sequb-server`
3. Copy to frontend: `./build-backend.sh`
4. Test integration: `npm run tauri dev`

## Future Improvements

- [ ] Add proper authentication between frontend and backend
- [ ] Implement real node registry endpoint in backend
- [ ] Add WebSocket support for real-time execution updates
- [ ] Implement file-based plugin loading
- [ ] Add execution history and logs UI