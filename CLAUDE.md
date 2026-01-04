# Sequb UI - Project Context for Claude

## Overview
Sequb UI is a desktop application built with Tauri v2 that serves as a visual client for the Sequb workflow automation platform. It uses a Server-Driven UI (SDUI) architecture where the frontend dynamically renders based on instructions from the backend server.

## Architecture Principles

### 1. Server-Driven UI (SDUI)
- The frontend has NO hardcoded knowledge of specific node types
- All node definitions come from the backend's `/api/v1/nodes/registry` endpoint
- New node types (including WASM plugins) work without frontend changes
- Single `UniversalNode` component renders all node types dynamically

### 2. Sidecar Pattern
- The `sequb-server` binary runs as a sidecar process managed by Tauri
- Frontend spawns the server on startup and kills it on shutdown
- Communication happens over REST API on localhost
- Server port is dynamically allocated or defaults to 3000

### 3. Technology Stack
- **Shell**: Tauri v2 (Rust) - handles native windowing and process management
- **Frontend**: React 18 + TypeScript
- **Graph Engine**: ReactFlow (xyflow) - provides canvas physics
- **State**: Zustand - manages graph and registry state
- **API**: Axios + TanStack Query - handles server communication
- **Styling**: Tailwind CSS

## Key Files

### Core Application
- `src/App.tsx` - Main application component with layout
- `src/lib/api.ts` - API client for backend communication
- `src/types/schema.d.ts` - TypeScript types matching backend structs

### SDUI Implementation
- `src/features/canvas/UniversalNode.tsx` - Dynamic node renderer
- `src/features/properties/DynamicForm.tsx` - Dynamic property panel
- `src/lib/registry.ts` - Registry fetching logic

### State Management
- `src/stores/useGraphStore.ts` - Graph/workflow state
- `src/stores/useRegistryStore.ts` - Node registry state

### Tauri Backend
- `src-tauri/src/main.rs` - Sidecar lifecycle management
- `src-tauri/tauri.conf.json` - Tauri configuration

## Backend Requirements

The frontend expects these endpoints from `sequb-server`:

```typescript
// Health check
GET /api/v1/health

// Node registry (CRITICAL for SDUI)
GET /api/v1/nodes/registry
Response: {
  categories: string[]
  nodes: {
    [nodeType: string]: {
      label: string
      category: string
      icon?: string
      inputs: Array<{
        key: string
        widget: 'text' | 'textarea' | 'select' | 'code' | 'model_picker' | 'number' | 'checkbox'
        label: string
        options?: Array<{value: string, label: string}>
        defaultValue?: any
      }>
      outputs: Array<{
        key: string
        label: string
      }>
    }
  }
}

// Workflow CRUD
GET    /api/v1/workflows
POST   /api/v1/workflows
GET    /api/v1/workflows/:id
PUT    /api/v1/workflows/:id
DELETE /api/v1/workflows/:id

// Execution
POST   /api/v1/workflows/:id/execute
GET    /api/v1/executions/:id
GET    /api/v1/executions/:id/logs
POST   /api/v1/executions/:id/cancel

// Plugins
GET    /api/v1/plugins
POST   /api/v1/plugins (multipart/form-data)
DELETE /api/v1/plugins/:id
```

## Development Workflow

### Setup
1. Build backend: `cd ../sequb-protocol && cargo build --release --bin sequb-server`
2. Copy binary: `cp ../sequb-protocol/target/release/sequb-server src-tauri/binaries/sequb-server-x86_64-unknown-linux-gnu`
3. Install deps: `npm install`

### Running
- **Integrated**: `npm run tauri:dev` (recommended)
- **Separate** (for debugging):
  - Terminal 1: `cd ../sequb-protocol && cargo run --bin sequb-server`
  - Terminal 2: `npm run dev`

### Testing
- Lint: `npm run lint`
- Type check: `tsc --noEmit`
- Build: `npm run tauri:build`

## Common Tasks

### Adding a New Widget Type
1. Add the widget type to `NodeInput.widget` union in `src/types/schema.d.ts`
2. Create widget component in `src/features/properties/widgets/`
3. Add case in `DynamicForm.tsx` switch statement

### Debugging Sidecar Issues
1. Check Tauri dev console for sidecar stdout/stderr
2. Verify binary exists in `src-tauri/binaries/`
3. Test server separately: `PORT=3000 ../sequb-protocol/target/release/sequb-server`

### Customizing Node Appearance
Edit `src/features/canvas/UniversalNode.tsx`:
- Icon mapping in `iconMap` object
- Node styling with Tailwind classes
- Handle positions and colors

## Security Considerations
1. Server generates auth token on startup (TODO)
2. Token passed via `x-sequb-auth` header
3. Prevents other websites from accessing localhost API
4. Sidecar killed on window close to prevent orphan processes

## Performance Notes
- Registry cached for 10 minutes (see `useRegistry`)
- API responses cached for 5 minutes by TanStack Query
- ReactFlow handles thousands of nodes efficiently
- Virtualization not needed for node palette (typically <100 nodes)

## Future Enhancements
- [ ] Execution monitoring with real-time logs
- [ ] Plugin upload UI
- [ ] Workflow save/load functionality
- [ ] Dark mode support
- [ ] Keyboard shortcuts
- [ ] Undo/redo support
- [ ] Node search/filter in palette
- [ ] Multi-select and bulk operations
- [ ] Export workflows as JSON/YAML

## Troubleshooting

**Server won't start:**
- Check binary permissions: `chmod +x src-tauri/binaries/sequb-server-*`
- Verify binary architecture matches system
- Check if port 3000 is already in use

**Nodes not appearing:**
- Check browser console for API errors
- Verify `/api/v1/nodes/registry` returns valid JSON
- Check CORS headers on backend

**Drag and drop not working:**
- Ensure `nodeType` is set in drag data
- Check ReactFlow version compatibility
- Verify event handlers are properly bound