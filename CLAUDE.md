# Sequb UI - Development Context

## Project Overview

Sequb UI is the web frontend for the Sequb Protocol workflow orchestration system. It provides a browser interface for workflow creation and management through both chat and visual editor interfaces.

## Current Status

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS
- **State**: Zustand + TanStack Query
- **Backend Integration**: Full API client with offline fallback

## Technology Stack

- **Next.js 14**: App Router for routing
- **React 18.3.1**: UI library
- **TypeScript**: Type safety with strict mode
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Client state management
- **TanStack Query**: Server state and caching
- **React Flow**: Workflow editor visualization
- **Axios**: HTTP client with interceptors
- **Lucide React**: Icon library

## Project Structure

```
sequb-ui/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── approvals/         # Approval management
│   │   ├── executions/        # Execution monitoring
│   │   ├── login/             # Authentication
│   │   ├── metrics/           # Metrics dashboard
│   │   ├── register/          # User registration
│   │   ├── settings/          # User settings
│   │   ├── templates/         # Template library
│   │   ├── webhooks/          # Webhook management
│   │   ├── workflows/         # Workflow editor
│   │   └── page.tsx           # Home page with chat
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── chat/              # Chat interface components
│   │   ├── execution/         # Execution monitoring components
│   │   ├── layout/            # Layout components
│   │   ├── plugin/            # Plugin management components
│   │   ├── providers/         # React providers
│   │   ├── settings/          # Settings components
│   │   ├── template/          # Template components
│   │   ├── ui/                # Reusable UI components
│   │   └── workflow/          # Workflow editor components
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── i18n.ts            # Internationalization
│   │   ├── utils.ts           # Utilities
│   │   └── websocket.ts       # WebSocket service
│   ├── providers/
│   │   └── i18n-provider.tsx  # i18n context
│   ├── types/
│   │   └── sequb.ts           # TypeScript definitions
│   ├── hooks/                 # Custom React hooks
│   └── stores/                # Zustand stores
├── .env.example               # Environment template
├── next.config.js             # Next.js config
├── tailwind.config.ts         # Tailwind config
└── tsconfig.json             # TypeScript config
```

## Key Files

### Core Files
- `src/app/layout.tsx`: Root layout with provider hierarchy
- `src/app/page.tsx`: Home page with chat interface
- `src/lib/api.ts`: Centralized API client
- `src/types/sequb.ts`: TypeScript type definitions

### Key Stores
- `src/stores/ui-configuration-store.ts`: Backend-driven UI config
- `src/stores/preferences-store.ts`: User preferences management
- `src/stores/status-store.ts`: System and execution status
- `src/stores/chat-store.ts`: Chat session management
- `src/stores/node-registry-store.ts`: Workflow node types

### Key Components
- `src/components/chat/chat-interface.tsx`: Chat UI
- `src/components/workflow/workflow-editor.tsx`: Visual workflow editor
- `src/components/ui/status-indicator.tsx`: Health monitoring
- `src/components/providers/*`: Context providers

## Current Implementation

### Backend-Driven Architecture
- UI configuration loaded from server on startup
- User preferences synchronized with backend
- Dynamic language/timezone/theme options
- Feature flags for controlled rollouts
- Chat examples from backend configuration
- Validation limits from server

### State Management Pattern
- **Zustand Stores**: Client state (chat, preferences, UI config, status)
- **TanStack Query**: Server state with caching
- **localStorage**: Offline persistence
- **Context Providers**: Cross-cutting concerns

### Key Features Implemented
- Chat interface with session persistence
- Visual workflow editor with React Flow
- Real-time status monitoring (WebSocket)
- Backend-driven settings page
- Metrics dashboard with live data
- Authentication with MFA support
- Plugin upload and management
- Execution monitoring with progress tracking

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure `NEXT_PUBLIC_API_URL` to point to sequb-protocol server
3. Install dependencies with `npm install`
4. Start development server with `npm run dev`

### Available Scripts
- `npm run dev`: Development server on localhost:3000
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run lint`: ESLint checking
- `npm run typecheck`: TypeScript type checking

### Code Standards
- TypeScript strict mode enforced
- No `any` types permitted
- Component props properly typed
- API responses fully typed

## Backend Integration Requirements

### Expected Backend Endpoints
The frontend expects a sequb-protocol server running on the configured API URL with these endpoints:

- `GET /api/v1/health` - Server health check
- `GET /api/v1/nodes/registry` - Node type definitions for workflow building
- `POST /api/v1/workflows` - Create new workflows
- `GET /api/v1/workflows` - List user workflows
- `POST /api/v1/workflows/:id/execute` - Execute workflows
- `GET /api/v1/executions/:id` - Get execution status

### Authentication
- Bearer token authentication implemented
- Token stored in localStorage
- Automatic redirect on 401 responses
- Request interceptors add Authorization header

## Implementation Status

### Working Features
- Authentication flow (login/register/MFA)
- Chat interface with history
- Workflow editor with node configuration
- Real-time execution monitoring
- Backend-driven UI configuration
- User preferences synchronization
- Status indicators and health monitoring
- Metrics dashboard with API data
- Plugin upload interface
- Settings page with dynamic options

### Current Limitations
- Requires backend for full functionality
- Falls back to minimal data when offline
- Social auth UI not connected
- Some workflow features need backend support

## Development Guidelines

### Adding New Components
1. Create component in appropriate directory under `src/components/`
2. Export from index file if creating a component folder
3. Use TypeScript with proper prop typing
4. Follow existing naming conventions (kebab-case for files)

### Adding API Endpoints
1. Add endpoint to appropriate section in `src/lib/api.ts`
2. Create/update types in `src/types/sequb.ts`
3. Use TanStack Query for data fetching in components
4. Handle loading and error states

### Styling Guidelines
1. Use Tailwind CSS classes
2. Leverage CSS custom properties for theming
3. Follow responsive-first approach
4. Use existing component patterns

## Testing Strategy

### Current State
- No automated tests implemented
- Manual testing through development server
- Type checking via TypeScript compiler

### Recommended Additions
- Unit tests for utility functions
- Component testing for UI elements
- Integration tests for API client
- End-to-end tests for critical workflows

## Deployment Considerations

### Build Process
- Next.js static export ready
- Environment variables at build time
- TypeScript compilation required
- Tailwind CSS processing included

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API base URL (required)
- `NEXT_PUBLIC_WS_URL`: WebSocket URL (planned)
- `NODE_ENV`: Environment setting

## Deployment Architecture

### Island Architecture
The sequb-ui frontend is designed to be deployed alongside sequb-protocol backend instances in an island architecture pattern:

- **Regional Instances**: Each deployment consists of a paired sequb-protocol backend and sequb-ui frontend instance
- **Geographic Distribution**: Instances are deployed per region or country (e.g., US, AU, UK, EU)
- **User Assignment**: Users are assigned to or select an instance based on geographic location during registration
- **Data Isolation**: Each island operates independently with its own data storage and user base
- **Deployment Technology**: Infrastructure deployed using Terraform and NixOS to Vultr cloud infrastructure
- **Package Deployment**: Frontend and backend are deployed as a coordinated package to ensure compatibility

### Instance Configuration
- Each sequb-ui instance connects to its local sequb-protocol backend via `NEXT_PUBLIC_API_URL`
- WebSocket connections remain within the same island for low latency
- No cross-island communication in the base architecture
- Each island maintains its own user authentication and workflow data

## Future Development Areas

### Potential Enhancements
1. Enhanced workflow versioning and branching
2. Collaborative editing and real-time collaboration
3. Advanced analytics and reporting dashboard
4. Mobile application for workflow monitoring
5. Offline mode with local execution support
6. Custom node development SDK
7. Enterprise SSO integration
8. Advanced role-based permissions
9. Workflow marketplace for sharing templates
10. AI-powered workflow optimization suggestions

## Troubleshooting

### Common Issues
- **Build failures**: Check TypeScript errors with `npm run typecheck`
- **Style issues**: Verify Tailwind CSS configuration
- **API errors**: Check backend server status and CORS settings
- **Development server**: Ensure port 3000 is available

### Debug Information
- Check browser console for JavaScript errors
- Verify network requests in browser dev tools
- Review Next.js build output for optimization warnings
- Use React Developer Tools for component debugging