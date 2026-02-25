# Nexus // Thinking Engine

## Overview

Nexus is an advanced AI chat interface with multi-modal thinking capabilities. It provides a sophisticated conversation experience with different reasoning modes (What If, Chain Reaction, Parallel Timelines) that influence how the AI processes and responds to user queries. The application features a modern, responsive design with light/dark theme support, file upload capabilities, and conversation persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context for global state (theme, mode), TanStack Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom theme variables and CSS custom properties
- **Animations**: Framer Motion for smooth UI transitions and particle background effects

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Structure**: RESTful endpoints under `/api/` prefix
- **File Uploads**: Presigned URL pattern using Google Cloud Storage via Uppy

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` for shared type definitions
- **Tables**: 
  - `users` - Basic user authentication
  - `conversations` - Chat conversation metadata
  - `messages` - Individual chat messages linked to conversations
- **In-Memory Fallback**: MemStorage class for development without database

### AI Integration
- **Provider**: OpenRouter API (configured via `OPENROUTER_API_KEY`)
- **Streaming**: Server-Sent Events (SSE) for real-time AI response streaming
- **Thinking Modes**: Three distinct reasoning patterns that modify AI behavior

### Key Design Patterns
- **Shared Types**: `/shared` directory contains schemas and types used by both client and server
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Modular Integrations**: `/server/replit_integrations/` contains isolated feature modules (chat, object storage, image generation, batch processing)

## External Dependencies

### AI Services
- **OpenRouter**: Primary AI provider for chat completions (requires `OPENROUTER_API_KEY`)
- **OpenAI-compatible API**: Image generation via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`)

### Cloud Storage
- **Google Cloud Storage**: File uploads with presigned URLs, accessed via Replit sidecar at `http://127.0.0.1:1106`

### Database
- **PostgreSQL**: Required for production (requires `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations stored in `/migrations`

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API authentication
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI image generation (optional)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI base URL (optional)