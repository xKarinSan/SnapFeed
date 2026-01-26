# UI Feedback Collector - Implementation Plan

## Overview

A self-hosted web application for collecting real-time feedback on web UIs during meetings. Users can embed external sites via iframe, place positional feedback pins directly on the UI, add general (non-UI) feedback, and export consolidated feedback to markdown. Real-time sync ensures all meeting participants see feedback as it's added.

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14 (App Router) | Full-stack React framework, API routes + WebSocket support, easy self-hosting |
| Database | SQLite + Prisma | Zero-config local database, great for self-hosting, Prisma provides type-safe queries |
| Real-time | Socket.io | Battle-tested WebSocket library, works well with Next.js custom server |
| Styling | Tailwind CSS | Rapid UI development, no runtime overhead |
| State | Zustand | Lightweight state management for real-time sync |
| Export | markdown-it | Flexible markdown generation |

## Features

### 1. Project Management
- **Description**: CRUD operations for projects containing a URL to review
- **Components**:
  - `app/page.tsx` - Project list/dashboard
  - `app/projects/[id]/page.tsx` - Project detail view
  - `lib/db/projects.ts` - Database operations
- **Dependencies**: None (core feature)

### 2. Live Iframe Feedback Overlay
- **Description**: Embed target URL in iframe with transparent overlay for placing feedback pins
- **Components**:
  - `components/FeedbackCanvas.tsx` - Overlay layer handling click-to-pin
  - `components/FeedbackPin.tsx` - Visual pin marker with popover
  - `components/IframeViewer.tsx` - Managed iframe with error handling
- **Dependencies**: Project Management

### 3. Feedback Types (UI & Non-UI)
- **Description**: UI feedback has x/y coordinates + viewport info; Non-UI is general text feedback
- **Components**:
  - `components/FeedbackForm.tsx` - Form for adding feedback content
  - `components/FeedbackPanel.tsx` - Sidebar listing all feedback
  - `lib/db/feedback.ts` - Database operations
- **Dependencies**: Project Management

### 4. Real-time Collaboration
- **Description**: WebSocket sync so all participants see feedback instantly
- **Components**:
  - `server.ts` - Custom Next.js server with Socket.io
  - `lib/socket/client.ts` - Client-side socket connection
  - `lib/socket/events.ts` - Event type definitions
  - `hooks/useRealtimeFeedback.ts` - React hook for subscribing to updates
- **Dependencies**: Feedback Types

### 5. Session Management
- **Description**: Lightweight session with display name (no auth required)
- **Components**:
  - `components/JoinSession.tsx` - Name prompt modal
  - `lib/session.ts` - Session storage (localStorage + socket room)
- **Dependencies**: None

### 6. Markdown Export
- **Description**: Export all feedback for a project as structured markdown
- **Components**:
  - `app/api/projects/[id]/export/route.ts` - Export API endpoint
  - `lib/export/markdown.ts` - Markdown generation logic
- **Dependencies**: Feedback Types

## Data Schema

```prisma
model Project {
  id          String     @id @default(cuid())
  name        String
  url         String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  feedbacks   Feedback[]
  sessions    Session[]
}

model Feedback {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        String    // "ui" | "non-ui"
  content     String
  author      String    // Display name from session

  // UI feedback positioning (null for non-ui type)
  posX        Float?
  posY        Float?
  viewportW   Int?
  viewportH   Int?
  selector    String?   // Optional CSS selector for element

  createdAt   DateTime  @default(now())
  resolved    Boolean   @default(false)
}

model Session {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  displayName String
  socketId    String?
  joinedAt    DateTime @default(now())
  lastSeen    DateTime @default(now())
}
```

## Implementation Steps

### Phase 1: Foundation
1. Initialize Next.js 14 project with TypeScript and Tailwind
2. Set up Prisma with SQLite database
3. Create database schema and run initial migration
4. Build project CRUD API routes (`/api/projects`)
5. Create project dashboard UI (list, create, delete projects)

### Phase 2: Core Feedback UI
6. Build iframe viewer component with error handling for blocked sites
7. Create transparent overlay canvas for click detection
8. Implement feedback pin component with positioning logic
9. Build feedback form (supports both UI and non-UI types)
10. Create feedback panel sidebar with list view

### Phase 3: Real-time Sync
11. Set up custom Next.js server with Socket.io integration
12. Define socket event types (join-room, new-feedback, update-feedback, etc.)
13. Implement `useRealtimeFeedback` hook for live updates
14. Add optimistic UI updates with rollback on failure
15. Handle reconnection and sync on rejoin

### Phase 4: Session & Polish
16. Create join session modal with display name input
17. Persist session to localStorage for page refreshes
18. Add participant presence indicators (who's viewing)
19. Implement feedback resolution (mark as addressed)

### Phase 5: Export & Deployment
20. Build markdown export logic with structured output
21. Create export API endpoint with download response
22. Add export button to project view
23. Write Dockerfile for self-hosted deployment
24. Create docker-compose.yml with volume for SQLite persistence

## Considerations

### Security
- **Iframe restrictions**: Some sites block iframe embedding (X-Frame-Options). Display clear error message when this occurs; consider documenting workarounds (browser extension, proxy)
- **Input sanitization**: Sanitize feedback content before rendering and export
- **Session tokens**: Use cryptographically random session IDs

### Performance
- **Viewport-relative positioning**: Store positions as percentages for responsive display
- **Debounce socket events**: Batch rapid updates to prevent flooding
- **Lazy load feedback pins**: Only render pins in visible viewport area for large feedback sets

### Testing Approach
- **Unit tests**: Prisma queries, markdown export logic
- **Integration tests**: API routes with test database
- **E2E tests**: Playwright for critical flows (create project → add feedback → export)

### Deployment (Self-Hosted)
- Single Docker container with Next.js + SQLite
- Volume mount for `/data/feedback.db` persistence
- Environment variable for `NEXTAUTH_URL` (or base URL)
- Reverse proxy (nginx/Caddy) recommended for HTTPS

## Markdown Export Format

```markdown
# Feedback Report: [Project Name]
**URL**: https://example.com
**Exported**: January 25, 2026
**Total Feedback**: 12 items (8 UI, 4 General)

---

## UI Feedback

### 1. "The button color is hard to see" — Alice
- **Position**: Header area (x: 85%, y: 12%)
- **Status**: Resolved ✓

### 2. "Form labels are misaligned" — Bob
- **Position**: Main content (x: 45%, y: 67%)
- **Status**: Open

---

## General Feedback

### 1. "Overall navigation feels confusing" — Alice
- **Status**: Open

### 2. "Love the new color scheme!" — Charlie
- **Status**: Resolved ✓
```
