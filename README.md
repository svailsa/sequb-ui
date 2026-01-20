# Sequb UI

A modern web frontend for [Sequb Protocol](../sequb-protocol) - AI workflow orchestration made simple.

## Overview

Sequb UI provides a clean, ChatGPT-like interface for creating and managing AI workflows through natural language interactions. Built with Next.js 14 and TypeScript, it offers a seamless experience for workflow automation.

## Features

- **Natural Language Workflow Creation**: Chat interface for intuitive workflow design
- **Backend-Driven Architecture**: Dynamic integration with sequb-protocol APIs
- **Real-time Updates**: Live execution monitoring and progress tracking  
- **Modern Design**: Clean, minimal interface inspired by leading AI tools
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Type-Safe**: Full TypeScript coverage with strict mode enabled

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: Zustand for client state, TanStack Query for server state
- **API Client**: Axios with interceptors for auth and error handling
- **Real-time**: WebSocket integration (planned)

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

### Key Endpoints

- `GET /api/v1/health` - Health check
- `GET /api/v1/nodes/registry` - Node type definitions
- `POST /api/v1/workflows` - Create workflows
- `POST /api/v1/workflows/:id/execute` - Execute workflows
- `GET /api/v1/executions/:id` - Monitor execution status
- `POST /api/v1/chat/message` - Natural language processing

### WebSocket Support (Planned)

Real-time updates for:
- Execution progress monitoring
- Live log streaming
- Approval request notifications
- System status updates

## Architecture Principles

### Backend-Driven UI

Following the successful pattern from sequb-ios and sequb-android:
- Dynamic node definitions from `/api/v1/nodes/registry`
- Server-controlled workflow capabilities
- Minimal hardcoded frontend logic
- Easy extensibility without frontend changes

### Chat-First Design

- Natural language as primary interface
- Visual workflow editor as secondary tool
- Progressive disclosure of advanced features
- Focus on user intent over technical details

### Performance Optimizations

- **React Query Caching**: 5-minute stale time for static data
- **Component Lazy Loading**: Code splitting for better performance
- **Optimistic Updates**: Immediate UI feedback with rollback on error
- **Bundle Optimization**: Tree shaking and minimal dependencies

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

2. **Deploy static files:**
   The `out/` directory contains static files ready for deployment to any web server.

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NEXT_PUBLIC_WS_URL` - WebSocket server URL  
- `NODE_ENV` - Environment (development/production)

## Comparison with Mobile Apps

This web frontend follows the same architectural principles as the successful iOS and Android applications:

### Shared Concepts

- **Backend-driven UI**: Node definitions from server
- **Chat interface**: Natural language workflow creation
- **Real-time updates**: Live execution monitoring
- **Offline support**: Caching with sync capabilities (planned)

### Web-Specific Features

- **Responsive design**: Works on all screen sizes
- **Browser integration**: Deep links and bookmark support
- **Accessibility**: Full keyboard navigation and screen reader support
- **SEO optimization**: Server-side rendering for public pages

## Contributing

1. Follow TypeScript strict mode - no `any` types
2. Use provided UI components for consistency
3. Add proper error handling for all API calls
4. Include loading states for async operations
5. Write descriptive commit messages
6. Test on multiple browsers and screen sizes

## Roadmap

- [ ] **Phase 1**: Basic chat interface with workflow creation (✓ Complete)
- [ ] **Phase 2**: Visual workflow editor integration
- [ ] **Phase 3**: Real-time execution monitoring
- [ ] **Phase 4**: User authentication and multi-tenancy
- [ ] **Phase 5**: Plugin management interface
- [ ] **Phase 6**: Advanced features (approvals, webhooks, scheduling)

## License

This project is part of the Sequb Protocol workspace and follows the same MIT OR Apache-2.0 dual license.