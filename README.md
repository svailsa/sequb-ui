# Sequb UI

Modern web frontend for the [Sequb Protocol](../sequb-protocol) workflow orchestration system.

## Overview

Sequb UI provides a comprehensive browser-based interface for creating, managing, and monitoring workflows. It features both a conversational chat interface and a visual drag-and-drop workflow editor, built with Next.js 14, TypeScript, and React Flow.

## Key Features

### Core Functionality
- **Chat Interface**: AI-powered conversational workflow creation with session persistence
- **Visual Workflow Editor**: Drag-and-drop interface using React Flow
- **Real-time Monitoring**: Live execution tracking via WebSocket
- **Backend-Driven Architecture**: Dynamic UI configuration and feature flags
- **Messaging System**: Unified inbox for notifications, approvals, and support tickets

### Advanced Features
- **Authentication**: Secure login/register with MFA/TOTP support
- **Multi-language Support**: 8 languages with RTL support
- **Offline Capabilities**: Progressive enhancement with queue management
- **Plugin System**: Upload and manage custom workflow nodes
- **Approval Workflows**: Multi-step approval chains with messaging integration
- **Webhook Integration**: Event-driven workflow triggers
- **Metrics Dashboard**: Performance monitoring and analytics
- **Support System**: Integrated ticketing and help desk functionality
- **Backend-Driven Configuration**: Dynamic policies, validation, and error handling
- **Email Validation**: Comprehensive email checking with smart suggestions

## Technology Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 14 (App Router), React 18.3, TypeScript 5.7+ |
| **Styling** | Tailwind CSS, shadcn/ui patterns |
| **State Management** | Zustand (client), TanStack Query (server) |
| **API Integration** | Axios with interceptors, WebSocket |
| **Workflow Visualization** | React Flow |
| **Security** | CSRF protection, rate limiting, secure storage |

## Quick Start

### Prerequisites
- Node.js 18.17 or higher
- npm 9+
- Running [sequb-protocol](../sequb-protocol) backend

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sequb-ui.git
cd sequb-ui

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your backend URL:
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Start development server
npm run dev
```

Visit http://localhost:3000 to access the application.

## Project Structure

```
src/
├── app/                    # Next.js pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat interface
│   ├── messages/         # Messaging system components
│   ├── workflow/         # Workflow editor
│   └── providers/        # React context providers
├── services/             # Business logic
│   ├── api/             # API client with comprehensive endpoints
│   ├── auth/            # Authentication and rate limiting
│   ├── monitoring/      # Logging, errors, and backend context
│   ├── preferences/     # Backend-driven user preferences
│   ├── validation/      # Dynamic validation from backend
│   └── websocket/       # Real-time communication
├── stores/              # Zustand state stores
├── lib/utils/           # Utility functions
└── types/               # TypeScript definitions
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript compilation |

## Backend Integration

### Required Endpoints

The frontend expects these API endpoints from sequb-protocol:

```
GET  /api/v1/health              # Health check
GET  /api/v1/nodes/registry      # Available node types with user validation
POST /api/v1/workflows           # Create workflow
GET  /api/v1/workflows           # List workflows
POST /api/v1/workflows/:id/execute # Execute workflow
GET  /api/v1/executions/:id     # Execution status
GET  /api/v1/ui/configuration   # UI configuration
GET  /api/v1/user/preferences   # User preferences
GET  /api/v1/messages           # List user messages
GET  /api/v1/inbox              # Get user inbox
POST /api/v1/messages/:id/approve # Handle approvals
GET  /api/v1/support/tickets    # Support tickets

# Backend-Driven Services
GET  /api/v1/ui/security/policies        # Security policies & rules
GET  /api/v1/ui/errors/contexts         # Error contexts & suggestions
GET  /api/v1/ui/validation/schemas      # Dynamic validation schemas
POST /api/v1/ui/email/validate         # Email validation service
POST /api/v1/ui/email/suggestions      # Email correction suggestions
POST /api/v1/ui/email/validate/bulk    # Bulk email validation
```

### WebSocket Events

```javascript
// Real-time events
- execution_update   # Execution progress
- workflow_event    # Workflow state changes
- system_status     # Backend health
- message_created   # New message notifications
- message_updated   # Message status changes
- approval_received # Approval responses
- ticket_created    # New support tickets
```

## Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:8080

# Optional
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NODE_ENV=development
```

### Backend-Driven Configuration

The UI automatically fetches configuration from the backend:
- Feature flags and UI limits
- Security policies and validation rules
- Available languages and timezones
- Chat examples with error context
- Workflow constraints and node permissions
- Email validation with smart suggestions
- Rate limiting configurations
- User-specific preferences and defaults

## Architecture Highlights

### Backend-Driven Design
- UI configuration loaded from server
- Dynamic feature toggles and security policies
- Backend validation schemas and error contexts
- Synchronized user preferences with organizational defaults
- Rate limiting and authentication configuration
- Email validation with disposable domain detection

### Progressive Enhancement
- Offline detection and queuing
- Connection quality monitoring
- Fallback to cached data
- Graceful feature degradation

### Security Features
- CSRF token protection
- Backend-driven rate limiting
- Dynamic input sanitization policies
- Secure token storage with refresh timing
- XSS prevention and content security policies
- Email validation and disposable domain blocking

## Development Guide

### Code Standards

```typescript
// TypeScript strict mode - no 'any' types
interface Props {
  data: WorkflowData; // Properly typed
  onSave: (data: WorkflowData) => Promise<void>;
}

// Use barrel exports
import { Button, Card } from '@/components/ui';

// Handle errors with fallbacks
try {
  const data = await api.workflows.get(id);
  return data;
} catch (error) {
  logger.error('Failed to fetch workflow', error);
  return fallbackData;
}
```

### Adding Features

1. **New Service**: Create in `src/services/`
2. **New Component**: Add to appropriate `src/components/` subdirectory
3. **New API Endpoint**: Update `src/services/api/client.ts`
4. **New Store**: Create in `src/stores/` using Zustand

## Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start

# Or deploy to Vercel/Netlify
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Regional Deployment

Sequb UI supports island architecture for geographic distribution:

```env
# US Instance
NEXT_PUBLIC_API_URL=https://us.sequb.com
NEXT_PUBLIC_REGION=us

# EU Instance
NEXT_PUBLIC_API_URL=https://eu.sequb.com
NEXT_PUBLIC_REGION=eu
```

## Testing

### Current Testing
- TypeScript compilation checks
- ESLint code quality
- Build-time validation

### Planned Testing
- Unit tests (Jest)
- Component tests (React Testing Library)
- E2E tests (Playwright)
- Performance tests (Lighthouse)

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow code standards** (TypeScript strict, no `any`)
4. **Write tests** for new features
5. **Update documentation** as needed
6. **Submit a pull request**

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Roadmap

### Version 1.0 (Completed)
- [x] Full authentication with MFA/TOTP
- [x] Visual workflow editor with React Flow
- [x] Real-time execution monitoring
- [x] Comprehensive messaging system
- [x] Human-in-the-loop approval workflows
- [x] Support ticket management
- [x] Multi-language support (8 languages)
- [x] Plugin system with custom nodes
- [x] Webhook integration
- [x] Metrics dashboard
- [x] Offline capabilities

### Version 1.1 (Q1 2024)
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Enhanced offline mode
- [ ] Mobile responsive improvements

### Version 1.2 (Q2 2024)
- [ ] Workflow versioning
- [ ] Collaborative editing
- [ ] Advanced analytics
- [ ] Custom node SDK

### Future
- [ ] Mobile application
- [ ] Desktop application
- [ ] AI-powered optimization
- [ ] Enterprise features

## Support

### Documentation
- [Development Guide](./CLAUDE.md) - Detailed development documentation
- [Architecture Review](./ARCHITECTURE_REVIEW.md) - System architecture
- [API Documentation](../sequb-protocol/docs/api.md) - Backend API reference

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/your-org/sequb-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/sequb-ui/discussions)
- **Email**: support@sequb.io

## License

This project is part of the Sequb Protocol workspace and is dual-licensed:

- MIT License ([LICENSE-MIT](LICENSE-MIT))
- Apache License 2.0 ([LICENSE-APACHE](LICENSE-APACHE))

You may choose either license for your use.

---

Built with ❤️ by the Sequb team