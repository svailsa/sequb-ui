# Sequb UI

Web frontend for the [Sequb Protocol](../sequb-protocol) workflow orchestration system.

## Overview

Sequb UI provides a browser interface for creating and managing workflows through both a chat interface and visual workflow editor. Built with Next.js 14 and TypeScript.

## Features

- **Chat Interface**: Session management with persistent history
- **Visual Workflow Editor**: Drag-and-drop workflow builder using React Flow
- **Node Registry**: Dynamic loading from backend with offline fallback
- **Real-time Updates**: WebSocket integration for execution status
- **Backend-Driven Architecture**: Configuration, preferences, and UI options from server
- **Status Monitoring**: System health and execution status indicators
- **Authentication**: Login/register with MFA/TOTP support
- **Plugin System**: Upload and management interface
- **Internationalization**: Multi-language support (8 languages)
- **User Preferences**: Backend-synchronized settings management

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS
- **UI Components**: Custom components following shadcn/ui patterns  
- **State Management**: Zustand for client state, TanStack Query for server state
- **API Client**: Axios with auth interceptors
- **Workflow Editor**: React Flow

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

## Architecture

### Design Principles

- **Backend-Driven**: Configuration, preferences, and UI options from server
- **Type Safety**: TypeScript strict mode
- **Progressive Enhancement**: Fallback to defaults when backend unavailable
- **State Persistence**: Local storage for offline capability

### Key Implementation Features

- **UI Configuration Store**: Backend-driven configuration management
- **Preferences System**: Synchronized user settings with backend
- **Status Monitoring**: Real-time health and execution status
- **Feature Flags**: Backend-controlled feature toggles
- **Dynamic Options**: Languages, timezones, and themes from server

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

## Implementation Status

### Completed Features
- Chat interface with session management
- Visual workflow editor with React Flow
- Backend-driven UI configuration system
- User preferences with backend synchronization
- Real-time status indicators
- Authentication flow (login/register/MFA)
- Plugin upload and management
- Execution monitoring with WebSocket updates
- Metrics dashboard with API integration
- Settings page with dynamic options
- Internationalization support

### Backend Integration
- API client with all endpoints implemented
- Fallback data for offline development
- WebSocket service for real-time updates
- Bearer token authentication
- CSRF protection
- Health monitoring with status indicators

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use provided UI components for consistency
3. Add proper error handling for all API calls
4. Include loading states for async operations
5. Write descriptive commit messages
6. Test on multiple browsers and screen sizes

## Future Development

### Planned Enhancements
- Workflow versioning
- Collaborative editing
- Enhanced offline support
- Mobile responsive improvements
- Advanced permission system
- Custom node development
- SSO integration

## License

This project is part of the Sequb Protocol workspace and follows the same MIT OR Apache-2.0 dual license.