# Sequb UI - Development Context for Claude

## Project Overview

Sequb UI is the web frontend for the Sequb Protocol workflow orchestration system. It provides a browser interface for workflow creation and management through both chat and visual editor interfaces.

## Current Status

**Architecture**: Next.js 14 with App Router, TypeScript 5.7+ with strict mode
**Development Stage**: Full-featured implementation with comprehensive backend integration
**Backend Integration**: Complete API client with offline fallback capabilities
**Key Achievement**: Backend-driven architecture with dynamic UI configuration

## Technology Stack

### Core Framework
- **Next.js**: 14.x with App Router
- **TypeScript**: 5.7+ with strict mode enabled
- **React**: 18.3.1

### Styling and UI
- **Tailwind CSS**: 3.4+ with custom CSS variables
- **UI Components**: Custom components following shadcn/ui patterns
- **Icons**: Lucide React
- **Workflow Visualization**: React Flow

### State Management
- **TanStack Query**: Server state management and caching
- **Zustand**: Client state with persistence (chat, preferences, UI config)
- **Context Providers**: Cross-cutting concerns (i18n, WebSocket, auth)

### Backend Integration
- **Axios**: HTTP client with interceptors
- **WebSocket**: Real-time updates
- **Type Safety**: Full TypeScript coverage for API responses

## Project Structure

```
sequb-ui/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth routes)/       # Login, register pages
│   │   ├── (dashboard routes)/  # Main application pages
│   │   ├── approvals/           # Approval management
│   │   ├── executions/          # Execution monitoring
│   │   ├── messages/            # Messaging system and inbox
│   │   ├── metrics/             # Metrics dashboard
│   │   ├── settings/            # User settings
│   │   ├── templates/           # Template library
│   │   ├── webhooks/            # Webhook management
│   │   ├── workflows/           # Workflow editor
│   │   └── page.tsx             # Home page with chat
│   │
│   ├── components/              # React components
│   │   ├── auth/               # Authentication (MFA, guards)
│   │   ├── chat/               # Chat interface components
│   │   ├── execution/          # Execution monitoring
│   │   ├── layout/             # Layout (header, sidebar)
│   │   ├── messages/           # Messaging system components
│   │   ├── plugin/             # Plugin management
│   │   ├── providers/          # All React providers
│   │   ├── settings/           # Settings components
│   │   ├── template/           # Template components
│   │   ├── ui/                 # Reusable UI components (with index.ts)
│   │   └── workflow/           # Workflow editor components
│   │
│   ├── services/               # Business logic and integrations
│   │   ├── api/               # API client and configuration
│   │   │   ├── client.ts      # Axios instance and endpoints
│   │   │   └── index.ts       # Barrel export
│   │   ├── auth/              # Authentication services
│   │   │   ├── auth-service.ts
│   │   │   ├── csrf.ts
│   │   │   ├── rate-limiter.ts
│   │   │   └── index.ts
│   │   ├── monitoring/        # Monitoring and logging
│   │   │   ├── logger.ts
│   │   │   ├── error-context.ts
│   │   │   └── index.ts
│   │   ├── websocket/         # WebSocket service
│   │   │   ├── websocket.ts
│   │   │   └── index.ts
│   │   ├── validation/        # Backend-driven validation
│   │   │   └── validation.ts
│   │   ├── offline/           # Offline support
│   │   │   └── offline.ts
│   │   ├── storage/           # Secure storage
│   │   │   └── secure-storage.ts
│   │   ├── i18n/              # Internationalization
│   │   │   └── i18n.ts
│   │   └── discovery/         # Region discovery
│   │       └── discovery.ts
│   │
│   ├── lib/                    # Pure utility functions
│   │   └── utils/             # Utility functions
│   │       ├── cn.ts          # Class name utility
│   │       ├── safe-json.ts   # Safe JSON parsing
│   │       ├── sanitizer.ts   # Input sanitization
│   │       ├── timer-utils.ts # Timer utilities
│   │       └── index.ts       # Barrel export
│   │
│   ├── stores/                # Zustand state stores
│   │   ├── chat-store.ts      # Chat session management
│   │   ├── node-registry-store.ts # Workflow nodes
│   │   ├── preferences-store.ts # User preferences
│   │   ├── status-store.ts    # System status
│   │   └── ui-configuration-store.ts # UI config
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-websocket.ts  # WebSocket hook
│   │   └── use-toast.ts      # Toast notifications
│   │
│   └── types/                # TypeScript definitions
│       └── sequb.ts          # Core type definitions
│
├── public/                   # Static assets
├── .env.example             # Environment template
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Key Implementation Details

### Services Layer (New)
The services directory contains all business logic and external integrations:
- **api/**: Centralized API client with all endpoints including messages
- **auth/**: Authentication, CSRF protection, rate limiting
- **monitoring/**: Logging and error context with backend integration
- **websocket/**: Real-time communication for executions and messages
- **validation/**: Backend-driven schema validation
- **offline/**: Progressive enhancement and offline queue
- **storage/**: Secure data persistence
- **i18n/**: Multi-language support (8 languages)
- **discovery/**: Multi-region support

### State Management Architecture
- **Zustand Stores**: Client-side state with localStorage persistence
  - `ui-configuration-store`: Backend-driven UI configuration
  - `preferences-store`: User preferences synchronized with backend
  - `status-store`: Real-time system and execution status
  - `chat-store`: Chat sessions and history
  - `node-registry-store`: Dynamic workflow node types
- **TanStack Query**: Server state with intelligent caching
- **Context Providers**: Cross-cutting concerns in `components/providers/`

### Backend-Driven Features
- Dynamic UI configuration loaded on startup
- Feature flags for controlled rollouts
- Validation schemas fetched from backend
- Error context and suggestions from server
- User preferences synchronized bidirectionally
- Dynamic language/timezone/theme options
- Chat examples from backend configuration
- Workflow node registry from server

### Security Features
- CSRF token protection
- Rate limiting on sensitive operations
- Secure storage with encryption support
- Input sanitization for XSS prevention
- Safe JSON parsing to prevent crashes
- Bearer token authentication
- Automatic token refresh

### Progressive Enhancement
- Offline detection and queue management
- Connection quality monitoring
- Fallback to cached data when offline
- Graceful degradation of features
- Local storage persistence for critical data

## Development Workflow

### Environment Setup
```bash
# 1. Clone repository
git clone https://github.com/your-org/sequb-ui.git
cd sequb-ui

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URL

# 4. Start development
npm run dev
```

### Available Scripts
- `npm run dev` - Development server (http://localhost:3000)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint checking
- `npm run typecheck` - TypeScript compilation check

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types
- **Components**: Properly typed props and exports
- **API**: Full type coverage for requests/responses
- **Imports**: Use barrel exports where available
- **Error Handling**: Comprehensive with fallbacks
- **State**: Immutable updates, proper typing

## API Integration

### Backend Requirements
The frontend expects a sequb-protocol server with these endpoints:

#### Core Endpoints
- `GET /api/v1/health` - Health check
- `GET /api/v1/ui/configuration` - UI configuration
- `GET /api/v1/ui/feature-flags` - Feature flags
- `GET /api/v1/user/preferences` - User preferences
- `GET /api/v1/nodes/registry` - Workflow node types

#### Workflow Management
- `GET/POST /api/v1/workflows/*` - CRUD operations
- `POST /api/v1/workflows/:id/execute` - Execute workflow
- `GET /api/v1/executions/*` - Execution monitoring

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/mfa/*` - MFA operations

#### Messages and Notifications
- `GET /api/v1/messages` - List user messages
- `GET /api/v1/messages/:id` - Get specific message
- `PUT /api/v1/messages/:id` - Update message (mark read, archive)
- `DELETE /api/v1/messages/:id` - Delete message
- `POST /api/v1/messages/:id/approve` - Handle approval responses
- `GET /api/v1/inbox` - Get user inbox with filters
- `GET /api/v1/support/tickets` - List support tickets
- `POST /api/v1/support/tickets` - Create support ticket
- `POST /api/v1/messages/notifications/send` - Send notifications

### WebSocket Events
- `execution_update` - Real-time execution status
- `workflow_event` - Workflow state changes
- `system_status` - Backend health updates
- `message_created` - New message notifications
- `message_updated` - Message status changes
- `approval_received` - Approval workflow responses
- `ticket_created` - New support tickets
- `ticket_updated` - Support ticket status changes

## Current Implementation Status

### ✅ Completed Features
- Full authentication flow with MFA/TOTP
- Chat interface with persistent sessions
- Visual workflow editor with React Flow
- Real-time execution monitoring
- Backend-driven UI configuration
- User preferences synchronization
- Multi-language support (8 languages)
- Plugin upload and management
- Metrics dashboard with live data
- Webhook configuration interface
- Approval workflow management
- Template library with import/export
- Offline detection and queue
- Progressive enhancement
- Error boundary with backend context
- Dynamic feature flags system
- Connection quality monitoring
- **Comprehensive messaging system with:**
  - Unified inbox for all notifications
  - Multi-category message support (approvals, alerts, errors, tickets)
  - Real-time message delivery and updates
  - Human-in-the-loop approval workflows
  - Support ticket management
  - Message filtering and search capabilities
  - Archive and deletion operations
  - Priority-based message organization

### ⚠️ Known Limitations
- Backend required for full functionality
- Social auth UI present but not connected
- Some advanced workflow features pending backend
- No automated tests implemented yet

## Development Guidelines

### Adding New Features

#### 1. New Service
```typescript
// src/services/my-service/my-service.ts
export class MyService {
  // Implementation
}

// src/services/my-service/index.ts
export { myService } from './my-service';
```

#### 2. New Component
```typescript
// src/components/feature/my-component.tsx
export function MyComponent() {
  // Implementation
}

// Add to barrel export if creating UI component
// src/components/ui/index.ts
export { MyComponent } from './my-component';
```

#### 3. New API Endpoint
```typescript
// src/services/api/client.ts
myEndpoint: {
  get: () => apiClient.get('/api/v1/my-endpoint'),
  create: (data) => apiClient.post('/api/v1/my-endpoint', data),
}
```

#### 4. Messages System Components
The messaging system follows a modular component structure:

```typescript
// Message display components
import { MessageCard, MessageList, MessageDialog } from '@/components/messages';

// Core message types
interface Message {
  id: string;
  category: MessageCategory; // union type for different message types
  priority: MessagePriority; // critical, high, normal, low
  status: MessageStatus;     // unread, read, archived, resolved, expired
  // ... other fields
}

// Usage patterns
<MessageList 
  messages={messages} 
  onApprove={handleApproval}
  onMarkAsRead={markAsRead} 
/>
```

##### Component Responsibilities:
- **MessageCard**: Individual message display with quick actions
- **MessageList**: Paginated list with filtering and search
- **MessageDialog**: Detailed view with approval interface
- **Inbox API**: Backend integration with real-time updates

### Best Practices
1. **Use services layer** for business logic
2. **Keep components pure** - logic in services/hooks
3. **Type everything** - no implicit any
4. **Handle errors** - always provide fallbacks
5. **Consider offline** - use progressive enhancement
6. **Follow patterns** - consistency is key

## Testing Strategy

### Current Coverage
- TypeScript compilation checks
- Manual testing via development server
- Build-time validation

### Recommended Testing
- Unit tests for services and utilities
- Component testing with React Testing Library
- Integration tests for API client
- E2E tests for critical user journeys
- Performance testing for large workflows

## Deployment Architecture

### Island Architecture Pattern
Sequb UI is designed for regional deployment:

- **Regional Pairing**: Each UI instance paired with local backend
- **Data Isolation**: No cross-region data sharing
- **Geographic Distribution**: US, EU, AU, UK instances
- **User Assignment**: Based on geographic proximity
- **Technology Stack**: Terraform + NixOS + Vultr

### Configuration per Instance
```env
NEXT_PUBLIC_API_URL=https://us.sequb.example.com
NEXT_PUBLIC_WS_URL=wss://us.sequb.example.com
NEXT_PUBLIC_REGION=us
```

## Performance Optimizations

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **API Caching**: TanStack Query with stale-while-revalidate
- **Bundle Size**: Tree-shaking and minification
- **Lazy Loading**: Dynamic imports for heavy components

## Future Enhancements

### High Priority
1. Automated testing suite
2. Performance monitoring integration
3. Enhanced offline capabilities
4. Mobile responsive improvements
5. Workflow versioning system

### Medium Priority
1. Collaborative editing features
2. Advanced analytics dashboard
3. Custom node SDK
4. SSO integration
5. Workflow marketplace

### Long Term
1. Mobile application
2. Desktop application (Electron/Tauri)
3. AI-powered workflow optimization
4. Cross-region workflow sharing
5. Enterprise features

## Troubleshooting

### Common Issues

#### Build Failures
```bash
npm run typecheck  # Check TypeScript errors
npm run lint       # Check linting issues
```

#### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS configuration on backend
- Verify network connectivity

#### State Management Issues
- Clear localStorage: `localStorage.clear()`
- Check Redux DevTools for Zustand stores
- Verify provider hierarchy in `app/layout.tsx`

## Contributing Guidelines

1. **Code Style**: Follow existing patterns
2. **Type Safety**: No `any` types
3. **Error Handling**: Always handle edge cases
4. **Documentation**: Update relevant docs
5. **Testing**: Add tests for new features
6. **Commits**: Use conventional commits

## Support Resources

- **Documentation**: This file and README.md
- **Architecture**: See ARCHITECTURE_REVIEW.md
- **Issues**: GitHub Issues
- **Backend**: sequb-protocol repository

## License

Part of the Sequb Protocol workspace - MIT OR Apache-2.0 dual license.