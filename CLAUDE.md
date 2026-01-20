# Sequb UI - Development Context for Claude

## Project Overview

Sequb UI is a web frontend for the Sequb Protocol workflow orchestration system. It provides a browser-based interface for creating and managing workflows through a chat interface and traditional workflow management tools.

## Current Status

**Architecture**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
**Development Stage**: Core features implemented with backend integration
**Backend Integration**: Complete API client with graceful fallback to mock data
**Key Features Implemented**: ChatGPT-style chat interface with history, visual workflow editor, dynamic node registry

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
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles and CSS variables
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Home page component
│   ├── components/
│   │   ├── chat/              # Chat interface and history components
│   │   │   ├── chat-interface.tsx
│   │   │   └── chat-history-sidebar.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── providers/         # React providers
│   │   │   └── query-provider.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   └── workflow/          # Workflow editor components
│   │       ├── workflow-editor.tsx
│   │       ├── node-palette.tsx
│   │       └── custom-node.tsx
│   ├── lib/
│   │   ├── api.ts             # API client with all endpoints
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── sequb.ts           # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks
│   └── stores/                # Zustand stores for chat and node registry
│       ├── chat-store.ts
│       └── node-registry-store.ts
├── .env.example               # Environment variable template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Files and Their Purpose

### Core Application Files
- `src/app/layout.tsx`: Root layout with QueryProvider and global styles
- `src/app/page.tsx`: Main application page with sidebar, header, and chat interface
- `src/app/globals.css`: Global styles including CSS custom properties for theming

### Components
- `src/components/chat/chat-interface.tsx`: Main chat interface with message handling
- `src/components/layout/sidebar.tsx`: Navigation sidebar with menu items
- `src/components/layout/header.tsx`: Application header with user controls
- `src/components/providers/query-provider.tsx`: TanStack Query setup with default options

### API Integration
- `src/lib/api.ts`: Complete API client with endpoints for workflows, executions, registry, etc.
- `src/types/sequb.ts`: TypeScript type definitions matching backend API schemas

## Implementation Details

### Chat Interface
- Modern ChatGPT-style interface with welcome screen
- Zustand store for session management with localStorage persistence
- Real API integration with fallback to mock responses
- Auto-resizing textarea and proper loading states
- Chat history sidebar with CRUD operations

### API Client Structure
The API client (`src/lib/api.ts`) includes endpoints for:
- Health checks
- Chat sessions and messages
- Authentication
- Workflow CRUD operations
- Execution monitoring
- Dynamic node registry access
- Plugin management
- Webhooks and approvals

### Styling Approach
- Uses Tailwind CSS with custom CSS variables for theming
- Implements light mode with dark mode infrastructure ready
- Responsive design with mobile-first approach
- Component-based styling with proper abstraction

### State Management
- TanStack Query handles server state with intelligent caching
- Zustand stores implemented for chat sessions and node registry
- localStorage persistence for chat history and user preferences
- Comprehensive error handling with automatic retry for transient failures

### Visual Workflow Editor
- React Flow-based drag-and-drop interface
- Dynamic node palette with search and categorization
- Custom node components with proper TypeScript integration
- Real-time workflow building with save/execute functionality

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

## Current Limitations

### Not Yet Implemented
- User authentication and authorization flows
- Dynamic form generation for node configuration
- Real-time execution monitoring with WebSockets
- Plugin management interface
- Advanced workflow features (versioning, approval workflows)

### Known Issues
- Node configuration forms not yet implemented
- WebSocket integration incomplete
- Some error edge cases need additional handling
- Authentication system requires backend implementation

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

## Future Development Areas

### Short Term
1. Complete dynamic form generation for node configuration
2. Implement WebSocket integration for real-time updates
3. Add user authentication and authorization flows
4. Build execution monitoring and management pages

### Medium Term
1. Advanced workflow operations (versioning, branching, approval workflows)
2. Plugin management and custom node development
3. Collaboration features and workspace sharing
4. Performance analytics and workflow optimization tools

### Long Term
1. Offline functionality with local workflow execution
2. Advanced AI-powered workflow suggestions
3. Enterprise features (SSO, audit logs, role management)
4. Mobile app with workflow monitoring capabilities

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