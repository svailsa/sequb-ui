# Sequb UI

A web frontend for [Sequb Protocol](../sequb-protocol) workflow orchestration system.

## Overview

Sequb UI is a browser-based interface for creating and managing workflows. It provides a chat interface for natural language interactions and traditional workflow management tools. Built with Next.js 14 and TypeScript.

## Features

- **Chat Interface**: Natural language workflow creation through conversational UI
- **Backend Integration**: API client for sequb-protocol endpoints
- **Responsive Design**: Works on desktop and mobile browsers
- **TypeScript**: Type-safe development with strict mode
- **Component-based UI**: Reusable components with Tailwind CSS styling
- **Development Tools**: ESLint, TypeScript checking, and hot reload

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: Zustand for client state, TanStack Query for server state
- **API Client**: Axios with interceptors for auth and error handling
- **Real-time**: WebSocket support (not implemented)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with CSS variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Home page
├── components/
│   ├── chat/              # Chat interface components
│   ├── layout/            # Header, sidebar, navigation
│   ├── providers/         # React Query and other providers
│   ├── ui/                # Reusable UI components
│   └── workflows/         # Workflow-related components
├── lib/
│   ├── api.ts             # API client and endpoints
│   └── utils.ts           # Utility functions
├── types/
│   └── sequb.ts           # TypeScript type definitions
├── hooks/                 # Custom React hooks
└── stores/                # Zustand stores
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

The frontend includes an API client with endpoints for:
- Health checks (`/api/v1/health`)
- Workflow operations (`/api/v1/workflows/*`)
- Execution monitoring (`/api/v1/executions/*`)
- Node registry access (`/api/v1/nodes/registry`)
- Authentication (`/api/v1/auth/*`)
- Plugin management (`/api/v1/plugins/*`)

Note: Backend integration requires a running sequb-protocol server.

## Architecture Principles

### Design Principles

- **Backend-Driven**: Node definitions loaded from server registry
- **Chat Interface**: Primary interaction through conversational UI
- **Type Safety**: TypeScript throughout the application
- **Component Reuse**: Modular UI components with consistent styling

### Performance Features

- **TanStack Query**: Server state caching with 5-minute stale time
- **Code Splitting**: Next.js automatic bundle optimization
- **Error Handling**: Retry logic for failed API requests

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

### Implemented
- Basic chat interface with message handling
- Responsive layout with sidebar navigation
- API client with full endpoint coverage
- TypeScript type definitions
- Component structure and styling

### Not Implemented
- Real backend integration (uses mock responses)
- User authentication
- Visual workflow editor
- Real-time execution monitoring
- WebSocket connections

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use provided UI components for consistency
3. Add proper error handling for all API calls
4. Include loading states for async operations
5. Write descriptive commit messages
6. Test on multiple browsers and screen sizes

## Development Roadmap

### Next Steps
- Connect to sequb-protocol backend server
- Implement real workflow creation from chat
- Add user authentication flow
- Build execution monitoring interface

### Future Features
- Visual workflow editor
- Real-time updates via WebSocket
- Plugin management
- Advanced workflow operations

## License

This project is part of the Sequb Protocol workspace and follows the same MIT OR Apache-2.0 dual license.