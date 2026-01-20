# Sequb UI - Development Context for Claude

## Project Overview

Sequb UI is a web frontend for the Sequb Protocol workflow orchestration system. It provides a browser-based interface for creating and managing workflows through a chat interface and traditional workflow management tools.

## Current Status

**Architecture**: Next.js 14 with App Router, TypeScript, and Tailwind CSS
**Development Stage**: Initial implementation complete
**Backend Integration**: API client implemented, requires connection to running sequb-protocol server
**Key Features Implemented**: Basic chat interface, responsive layout, component structure

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
- **Zustand**: Ready for client-side state (not yet implemented)

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
│   │   ├── chat/              # Chat interface components
│   │   │   └── chat-interface.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── providers/         # React providers
│   │   │   └── query-provider.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   └── input.tsx
│   │   └── workflows/         # Workflow components (placeholder)
│   ├── lib/
│   │   ├── api.ts             # API client with all endpoints
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── sequb.ts           # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks (placeholder)
│   └── stores/                # Zustand stores (placeholder)
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
- Built with React state management
- Supports user and assistant message types
- Includes loading states and animations
- Currently uses mock responses (placeholder for backend integration)

### API Client Structure
The API client (`src/lib/api.ts`) includes endpoints for:
- Health checks
- Authentication
- Workflow CRUD operations
- Execution monitoring
- Node registry access
- Plugin management
- Webhooks and approvals

### Styling Approach
- Uses Tailwind CSS with custom CSS variables for theming
- Implements light mode with dark mode infrastructure ready
- Responsive design with mobile-first approach
- Component-based styling with proper abstraction

### State Management
- TanStack Query handles server state with 5-minute cache
- Client state management with Zustand is set up but not implemented
- Error handling with automatic retry for non-4xx errors

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
- User authentication flow
- Real backend integration (uses mock responses)
- Visual workflow editor
- Real-time execution monitoring
- Plugin management interface
- Workflow persistence

### Known Issues
- Chat interface uses placeholder responses
- No actual workflow creation logic
- Limited error handling in UI components
- No offline functionality

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
1. Connect to real sequb-protocol backend
2. Implement actual workflow creation
3. Add authentication flow
4. Build basic execution monitoring

### Medium Term
1. Visual workflow editor
2. Real-time updates via WebSocket
3. Plugin management interface
4. Advanced workflow features

### Long Term
1. Offline functionality
2. Advanced analytics
3. Collaboration features
4. Mobile app parity

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