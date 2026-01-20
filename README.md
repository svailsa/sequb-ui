# Sequb UI

A web frontend for [Sequb Protocol](../sequb-protocol) workflow orchestration system.

## Overview

Sequb UI is a browser-based interface for creating and managing workflows. It provides a chat interface for natural language interactions and traditional workflow management tools. Built with Next.js 14 and TypeScript.

## Features

- **Chat Interface**: Modern ChatGPT-style interface with session management and history
- **Visual Workflow Editor**: Drag-and-drop workflow builder with React Flow integration
- **Dynamic Node Registry**: Live loading of node types from backend with fallback support
- **Backend Integration**: Complete API client for sequb-protocol endpoints
- **Responsive Design**: Mobile-first design that works across all device sizes
- **TypeScript**: Strict type safety throughout the application
- **State Management**: Zustand stores with localStorage persistence and React Query caching

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.7+ with strict mode
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Custom components with shadcn/ui patterns  
- **State Management**: Zustand for client state, TanStack Query for server state
- **API Client**: Axios with interceptors for auth and error handling
- **Workflow Editor**: React Flow for visual workflow building

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── workflows/         # Workflow editor page
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page with chat interface
├── components/
│   ├── chat/              # Chat interface and history sidebar
│   ├── layout/            # Header, sidebar with dynamic node registry
│   ├── providers/         # React Query providers
│   ├── ui/                # Reusable UI components
│   └── workflow/          # Workflow editor, node palette, custom nodes
├── lib/
│   ├── api.ts             # API client and endpoints
│   └── utils.ts           # Utility functions
├── types/
│   └── sequb.ts           # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── stores/                # Zustand stores for chat and node registry
```

## Development

### Prerequisites

- Node.js 18.17+ 
- npm 9+
- [sequb-protocol](../sequb-protocol) backend running

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local to match your sequb-protocol backend URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open application:**
   Visit http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check

## Integration with sequb-protocol

The frontend is designed to integrate seamlessly with the sequb-protocol backend:

### API Integration

- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL` (default: http://localhost:3000)
- **Authentication**: Bearer token with automatic refresh
- **Error Handling**: Automatic retry with exponential backoff
- **Type Safety**: Full TypeScript coverage matching backend schemas

### API Endpoints

The frontend includes a complete API client with endpoints for:
- Health checks (`/api/v1/health`)
- Chat sessions and messages (`/api/v1/chat/*`) 
- Workflow operations (`/api/v1/workflows/*`)
- Execution monitoring (`/api/v1/executions/*`)
- Dynamic node registry (`/api/v1/nodes/registry`)
- Authentication (`/api/v1/auth/*`)
- Plugin management (`/api/v1/plugins/*`)

The frontend implements graceful fallback behavior with mock data when the backend is unavailable.

## Architecture Principles

### Design Principles

- **Backend-Driven**: Node definitions and configuration loaded from server registry
- **Modern UI**: ChatGPT-style interface patterns with visual workflow editing
- **Type Safety**: Strict TypeScript throughout with comprehensive type coverage
- **Graceful Degradation**: Fallback to mock data when backend unavailable
- **State Persistence**: Chat history and user preferences saved locally

### Performance Features

- **TanStack Query**: Server state caching with intelligent invalidation
- **Code Splitting**: Next.js automatic bundle optimization
- **Error Handling**: Comprehensive retry logic with exponential backoff
- **Optimistic Updates**: Immediate UI updates with server synchronization

## Deployment

### Development

Run alongside sequb-protocol:
```bash
# Terminal 1: Start backend
cd ../sequb-protocol && cargo run --bin sequb-server

# Terminal 2: Start frontend  
npm run dev
```

### Production

1. **Build application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm run start
   ```

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL  
- `NODE_ENV` - Environment (development/production)

## Current Status

### Implemented Features
- **Chat Interface**: Modern ChatGPT-style interface with session management
- **Chat History**: Persistent session storage with CRUD operations  
- **Visual Workflow Editor**: React Flow-based drag-and-drop workflow builder
- **Dynamic Node Registry**: Live loading from backend with comprehensive fallback
- **Node Palette**: Searchable, categorized node library with drag-and-drop
- **API Integration**: Complete client with error handling and retry logic
- **Responsive Design**: Mobile-first layout that adapts to all screen sizes
- **Type Safety**: Comprehensive TypeScript coverage throughout

### In Progress
- Dynamic form generation for node configuration
- WebSocket integration for real-time updates
- Additional management pages (executions, templates, settings)

### Not Yet Implemented
- User authentication and authorization flows
- Real-time execution monitoring and logs
- Plugin management interface
- Advanced workflow features (versioning, approval workflows)

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use provided UI components for consistency
3. Add proper error handling for all API calls
4. Include loading states for async operations
5. Write descriptive commit messages
6. Test on multiple browsers and screen sizes

## Development Roadmap

### Next Steps
- Complete dynamic form generation for node configuration
- Implement WebSocket integration for real-time updates
- Add user authentication and authorization flows
- Build execution monitoring and management pages

### Future Features
- Advanced workflow operations (versioning, branching, approval workflows)
- Plugin management and custom node development
- Collaboration features and workspace sharing
- Performance analytics and workflow optimization tools

## License

This project is part of the Sequb Protocol workspace and follows the same MIT OR Apache-2.0 dual license.