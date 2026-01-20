# Sequb UI - Development Context for Claude

## Project Overview

Sequb UI is a web frontend for the Sequb Protocol workflow orchestration system. It provides a browser-based interface for creating and managing workflows through a chat interface and traditional workflow management tools.

## Current Status

**Architecture**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
**Development Stage**: All major features implemented with backend integration
**Backend Integration**: API client with fallback to mock data
**Key Features Implemented**: Chat interface with history, visual workflow editor, dynamic node registry, authentication, i18n, plugin system, approval workflows, webhooks, metrics dashboard

## Technology Stack

### Core Framework
- **Next.js**: 14.x with App Router
- **TypeScript**: 5.7+ with strict mode enabled
- **React**: 18.3.1

### Styling and UI
- **Tailwind CSS**: 3.4+ with custom CSS variables
- **UI Components**: Custom components following shadcn/ui patterns
- **Icons**: Lucide React

### State Management
- **TanStack Query**: For server state management and caching
- **Zustand**: Implemented for chat sessions and node registry state

### API Integration
- **Axios**: HTTP client with interceptors
- **Type Safety**: Full TypeScript coverage for API responses

### Development Tools
- **ESLint**: Code linting with Next.js config
- **PostCSS**: CSS processing with autoprefixer

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

## Key Files and Their Purpose

### Core Application Files
- `src/app/layout.tsx`: Root layout with providers (i18n, Query, WebSocket)
- `src/app/page.tsx`: Main page with chat interface
- `src/app/globals.css`: Global styles with CSS custom properties

### Key Components
- `src/components/chat/chat-interface.tsx`: Chat interface with message handling
- `src/components/workflow/workflow-editor.tsx`: Visual workflow editor
- `src/components/execution/execution-list.tsx`: Execution monitoring
- `src/components/plugin/plugin-manager.tsx`: Plugin management
- `src/components/auth/mfa-setup.tsx`: MFA/TOTP setup flow

### Core Services
- `src/lib/api.ts`: API client with all endpoints
- `src/lib/i18n.ts`: Internationalization service
- `src/lib/websocket.ts`: WebSocket connection service
- `src/types/sequb.ts`: TypeScript type definitions

## Implementation Details

### Chat Interface
- Chat interface with welcome screen and examples
- Zustand store for session management with localStorage persistence
- API integration with fallback to mock responses
- Auto-resizing textarea with loading states
- Chat history sidebar with CRUD operations

### API Client Structure
The API client (`src/lib/api.ts`) includes endpoints for:
- Health checks
- Chat sessions and messages
- Authentication (login, register, profile)
- Workflow CRUD operations
- Execution monitoring
- Dynamic node registry access
- Plugin management
- Webhooks configuration
- Approval workflows
- Internationalization

### Styling Approach
- Tailwind CSS with custom CSS variables for theming
- Light mode implemented with dark mode infrastructure
- Responsive design approach
- Component-based styling patterns

### State Management
- TanStack Query for server state with caching
- Zustand stores for chat sessions and node registry
- localStorage persistence for chat history and user preferences
- Error handling with retry logic for transient failures

### Visual Workflow Editor
- React Flow drag-and-drop interface
- Dynamic node palette with search and categorization
- Custom node components with TypeScript types
- Node configuration modal with dynamic forms
- Workflow save and execute functionality

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

## Current Implementation Status

### Completed Features
- Authentication with login/register pages
- MFA/TOTP setup and verification
- Dynamic form generation for node configuration
- Real-time execution monitoring with WebSockets
- Plugin management interface with upload
- Approval workflows with response handling
- Webhook management with event subscriptions
- Metrics dashboard with performance monitoring
- Internationalization with 8 languages
- Template library with import/export

### Known Limitations
- Backend required for full functionality
- Mock data used when backend unavailable
- Social authentication UI present but not connected
- Some advanced workflow features pending backend support

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