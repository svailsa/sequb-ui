# Sequb UI

A web frontend for [Sequb Protocol](../sequb-protocol) workflow orchestration system.

## Overview

Sequb UI is a browser-based interface for creating and managing workflows. It provides a chat interface for natural language interactions and traditional workflow management tools. Built with Next.js 14 and TypeScript.

## Features

- **Chat Interface**: Chat interface with session management and history
- **Visual Workflow Editor**: Drag-and-drop workflow builder using React Flow
- **Dynamic Node Registry**: Loading of node types from backend with fallback support
- **Real-time Updates**: WebSocket integration for execution monitoring
- **Internationalization**: Support for 8 languages including RTL (Arabic, Urdu)
- **Authentication**: Login/register pages with MFA/TOTP support
- **Plugin System**: Plugin upload and management interface
- **Backend Integration**: API client for sequb-protocol endpoints
- **TypeScript**: Type safety with strict mode
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
├── app/                    # Next.js App Router pages
│   ├── approvals/         # Approval management page
│   ├── executions/        # Execution monitoring page  
│   ├── login/             # Authentication login page
│   ├── metrics/           # Metrics dashboard page
│   ├── register/          # User registration page
│   ├── settings/          # User settings page
│   ├── templates/         # Template library page
│   ├── webhooks/          # Webhook management page
│   ├── workflows/         # Workflow editor page
│   └── page.tsx           # Home page with chat interface
├── components/
│   ├── auth/              # Authentication components (MFA, guards)
│   ├── chat/              # Chat interface and history sidebar
│   ├── execution/         # Execution list and details
│   ├── layout/            # Header, sidebar with dynamic node registry
│   ├── plugin/            # Plugin manager and upload
│   ├── providers/         # React providers (Query, WebSocket, i18n)
│   ├── settings/          # Settings and preferences components
│   ├── template/          # Template gallery components
│   ├── ui/                # Reusable UI components
│   └── workflow/          # Workflow editor, node palette, config modal
├── lib/
│   ├── api.ts             # API client and endpoints
│   ├── i18n.ts            # Internationalization service
│   ├── utils.ts           # Utility functions
│   └── websocket.ts       # WebSocket service
├── providers/
│   └── i18n-provider.tsx  # i18n React context provider
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

The frontend includes an API client with endpoints for:
- Health checks (`/api/v1/health`)
- Chat sessions and messages (`/api/v1/chat/*`) 
- Workflow operations (`/api/v1/workflows/*`)
- Execution monitoring (`/api/v1/executions/*`)
- Dynamic node registry (`/api/v1/nodes/registry`)
- Authentication (`/api/v1/auth/*`)
- Plugin management (`/api/v1/plugins/*`)
- Approval workflows (`/api/v1/approvals/*`)
- Webhook configuration (`/api/v1/webhooks/*`)
- Internationalization (`/api/v1/i18n/*`)
- WebSocket connections (`/api/v1/ws/*`)

The frontend includes fallback to mock data when the backend is unavailable.

## Architecture Principles

### Design Principles

- **Backend-Driven**: Node definitions and configuration loaded from server registry
- **Type Safety**: TypeScript with strict mode enabled
- **Fallback Support**: Mock data when backend unavailable
- **State Persistence**: Chat history and user preferences saved locally
- **Internationalization**: Multi-language support with RTL capabilities

### Technical Features

- **TanStack Query**: Server state caching and invalidation
- **Code Splitting**: Next.js bundle optimization
- **Error Handling**: Retry logic with exponential backoff
- **WebSocket Integration**: Real-time updates for executions
- **Form Validation**: Input validation with error feedback

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
- **Core Pages**: All main application pages (chat, workflows, executions, templates, settings, etc.)
- **Chat Interface**: Chat interface with session management and history persistence
- **Workflow Editor**: React Flow-based drag-and-drop workflow builder with node configuration
- **Node Registry**: Dynamic loading from backend with mock data fallback
- **Authentication**: Login/register pages with MFA/TOTP setup components
- **Internationalization**: 8 language support with language selector
- **WebSocket Integration**: Real-time updates for execution monitoring
- **Plugin System**: Plugin upload and management interface
- **Approval Workflows**: Approval request handling and response UI
- **Webhook Management**: CRUD operations for webhook configuration
- **Metrics Dashboard**: Performance monitoring and statistics visualization
- **API Integration**: Client covering all backend endpoints with error handling

### Backend Integration Status
- API client connects to backend when available
- Fallback to mock data for development without backend
- WebSocket connection for real-time updates
- JWT authentication with token management

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use provided UI components for consistency
3. Add proper error handling for all API calls
4. Include loading states for async operations
5. Write descriptive commit messages
6. Test on multiple browsers and screen sizes

## Development Roadmap

### Potential Enhancements
- Enhanced workflow versioning and branching
- Collaborative editing features
- Advanced analytics and reporting
- Mobile application development
- Offline mode support
- Custom node development SDK
- Enterprise SSO integration
- Advanced permission management

## License

This project is part of the Sequb Protocol workspace and follows the same MIT OR Apache-2.0 dual license.