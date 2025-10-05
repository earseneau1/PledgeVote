# VoteGreek - Greek Life Voting Platform

## Overview

VoteGreek is a secure voting platform designed for Greek life organizations (fraternities and sororities) to conduct chapter votes and decisions. The application enables members to create, participate in, and view results of various types of votes including yes/no votes, multiple choice, and ranked choice voting. The platform provides real-time updates via WebSockets, comprehensive vote management, and a complete voting history archive.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Query (@tanstack/react-query) for server state management and data fetching

**UI Component System**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- New York style variant for shadcn components
- Custom color scheme for Greek life aesthetic (primary: navy blue, secondary: gold)

**State Management Pattern**
- React Query for server state (votes, users, results)
- Local component state for UI interactions
- WebSocket integration for real-time updates
- Custom hooks pattern for reusable logic (useAuth, useWebSocket)

**Key Design Decisions**
- Component-based architecture with reusable UI elements
- Path aliases (@/, @shared/, @assets/) for clean imports
- Mobile-responsive design with breakpoint utilities
- Toast notifications for user feedback

### Backend Architecture

**Server Framework**
- Express.js for REST API endpoints
- TypeScript with ES modules
- WebSocket server for real-time vote updates
- Session-based authentication

**API Structure**
- RESTful endpoints under `/api` prefix
- Authentication middleware on protected routes
- Vote management endpoints (create, retrieve, update status)
- User vote submission and results endpoints
- Real-time participation tracking

**Authentication & Session Management**
- Replit Auth integration via OpenID Connect (OIDC)
- Passport.js strategy for authentication flow
- PostgreSQL-backed session storage (connect-pg-simple)
- Secure session cookies with 7-day TTL
- User profile synchronization with auth provider

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon serverless driver
- Schema-first approach with TypeScript types
- Shared schema between client and server

### Data Storage

**Database Schema**
- `users` - User profiles with roles and chapter affiliation
- `votes` - Vote definitions with type, status, and timing
- `userVotes` - Individual vote submissions with choices
- `sessions` - Session storage for authentication

**Vote Types**
- Yes/No votes for binary decisions
- Multiple choice for selecting from options
- Ranked choice for preference ordering

**Vote Status Flow**
- Draft → Active → Closed
- Real-time status updates via WebSocket
- Participation tracking and quorum enforcement

**Key Design Patterns**
- Repository pattern via storage interface
- Upsert operations for user management
- JSONB columns for flexible vote choices storage
- Automatic timestamp tracking (createdAt, updatedAt)

### External Dependencies

**Authentication Service**
- Replit Auth (OIDC provider)
- Handles user authentication and profile management
- Automatic user provisioning and updates

**Database Service**
- Neon Serverless PostgreSQL
- WebSocket-enabled connection pooling
- Managed via DATABASE_URL environment variable

**Real-time Communication**
- WebSocket server (ws library)
- Broadcasts vote updates to connected clients
- Client reconnection handling

**UI Component Libraries**
- Radix UI for accessible component primitives
- Recharts for data visualization (pie charts, bar charts)
- Lucide React for consistent iconography

**Form Management**
- React Hook Form for form state
- Zod for runtime validation
- @hookform/resolvers for validation integration

**Development Tools**
- Replit-specific plugins for development banner and error overlay
- Vite plugins for enhanced developer experience