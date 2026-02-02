# Implementation Plan: Multiple Feedback Sessions per Project

## Overview

This plan introduces a `FeedbackSession` entity between `Project` and `Feedback/Screenshot`, enabling projects to support multiple feedback sessions. This transforms SnapFeed from a single-session tool into a continuous bug reporting and feedback platform where each project can have ongoing, organized feedback cycles.

**Key Changes:**
- New `FeedbackSession` model linking Project → Session → Feedback/Screenshot
- New routing structure: `/projects/[id]` shows sessions list, `/projects/[id]/sessions/[sessionId]` shows the feedback UI
- Updated data flow and API routes
- Migration of existing data

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Database | SQLite + Prisma | Existing stack, add FeedbackSession model |
| State | Zustand | Add session management to existing store |
| Routing | Next.js App Router | Add `/sessions/[sessionId]` nested route |
| UI | Tailwind CSS | Consistent with existing components |

---

## Data Schema

### Updated Schema Relationships

```
Project (unchanged fields)
├── id, name, url, createdAt, updatedAt
└── FeedbackSession[] (NEW)
    ├── id, projectId, title, createdAt, updatedAt
    ├── Feedback[]
    │   └── id, sessionId, content, createdAt, updatedAt
    └── Screenshot[]
        ├── id, sessionId, filename, pageUrl, pageTitle, createdAt
        └── Annotation[]
            └── id, screenshotId, content, posX, posY, createdAt, updatedAt
```

### Prisma Model Changes

**New Model: FeedbackSession**
```prisma
model FeedbackSession {
  id        String   @id @default(cuid())
  projectId String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  feedbacks   Feedback[]
  screenshots Screenshot[]
}
```

**Updated Model: Feedback**
```prisma
model Feedback {
  id         String   @id @default(cuid())
  sessionId  String                          // Changed from projectId
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt             // NEW
  session    FeedbackSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

**Updated Model: Screenshot**
```prisma
model Screenshot {
  id        String   @id @default(cuid())
  sessionId String                           // Changed from projectId
  filename  String
  pageUrl   String?
  pageTitle String?
  createdAt DateTime @default(now())

  session     FeedbackSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  annotations Annotation[]
}
```

**Updated Model: Annotation**
```prisma
model Annotation {
  id           String   @id @default(cuid())
  screenshotId String
  content      String
  posX         Float
  posY         Float
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  screenshot   Screenshot @relation(fields: [screenshotId], references: [id], onDelete: Cascade)
}
```

**Removed from Project:**
- Direct `feedbacks` relation
- Direct `screenshots` relation

**Added to Project:**
- `sessions FeedbackSession[]`

---

## Features

### Feature 1: FeedbackSession Management
- **Description**: CRUD operations for feedback sessions within a project
- **Files involved**:
  - `prisma/schema.prisma` - Add FeedbackSession model
  - `src/lib/db/sessions.ts` - NEW: Session database utilities
  - `src/app/api/projects/[id]/sessions/route.ts` - NEW: List/create sessions
  - `src/app/api/projects/[id]/sessions/[sessionId]/route.ts` - NEW: Get/update/delete session
- **Dependencies**: None (foundational)

### Feature 2: Project Page Redesign
- **Description**: Transform `/projects/[id]` into a sessions list page
- **Files involved**:
  - `src/app/projects/[id]/page.tsx` - Redesign as sessions list
  - `src/components/SessionCard.tsx` - NEW: Card component for sessions
  - `src/components/CreateSessionModal.tsx` - NEW: Modal for creating sessions
- **Dependencies**: Feature 1

### Feature 3: Session Detail Page
- **Description**: Move existing feedback UI to `/projects/[id]/sessions/[sessionId]`
- **Files involved**:
  - `src/app/projects/[id]/sessions/[sessionId]/page.tsx` - NEW: Move existing UI here
  - `src/components/MiniBrowser.tsx` - Update to use sessionId
  - `src/components/FeedbackPanel.tsx` - Update to use sessionId
- **Dependencies**: Feature 1, Feature 2

### Feature 4: API Route Restructuring
- **Description**: Update all feedback/screenshot APIs to use sessionId
- **Files involved**:
  - `src/app/api/projects/[id]/sessions/[sessionId]/feedback/route.ts` - NEW
  - `src/app/api/projects/[id]/sessions/[sessionId]/screenshots/route.ts` - NEW
  - `src/lib/db/feedback.ts` - Update to use sessionId
  - `src/lib/db/screenshots.ts` - Update to use sessionId
- **Dependencies**: Feature 1

### Feature 5: Zustand Store Updates
- **Description**: Add session state management
- **Files involved**:
  - `src/lib/store/useStore.ts` - Add currentSession, sessions array
- **Dependencies**: Feature 1

### Feature 6: Data Migration
- **Description**: Migrate existing data to new schema
- **Files involved**:
  - `prisma/migrations/` - Migration script
  - `scripts/migrate-data.ts` - NEW: Optional data migration script
- **Dependencies**: All features

---

## Implementation Steps

### Phase 1: Database Schema Changes

1. **Update Prisma schema**
   - Add `FeedbackSession` model
   - Update `Feedback` model (sessionId, remove projectId, add new fields)
   - Update `Screenshot` model (sessionId, remove projectId)
   - Update `Project` model (add sessions relation, remove direct relations)

2. **Create migration**
   - Run `npx prisma migrate dev --name add-feedback-sessions`
   - Handle data migration in migration SQL (create default session per project)

3. **Generate Prisma client**
   - Run `npx prisma generate`

### Phase 2: Database Utilities

4. **Create session database utilities**
   - File: `src/lib/db/sessions.ts`
   - Functions: `createSession`, `getSessions`, `getSession`, `updateSession`, `deleteSession`

5. **Update feedback utilities**
   - File: `src/lib/db/feedback.ts`
   - Change `projectId` references to `sessionId`
   - Add new optional fields (type, posX, posY, viewportW, viewportH, selector)

6. **Update screenshot utilities**
   - File: `src/lib/db/screenshots.ts`
   - Change `projectId` references to `sessionId`

### Phase 3: API Routes

7. **Create session API routes**
   - `src/app/api/projects/[id]/sessions/route.ts` (GET, POST)
   - `src/app/api/projects/[id]/sessions/[sessionId]/route.ts` (GET, PATCH, DELETE)

8. **Create session-scoped feedback routes**
   - `src/app/api/projects/[id]/sessions/[sessionId]/feedback/route.ts`
   - `src/app/api/projects/[id]/sessions/[sessionId]/feedback/[feedbackId]/route.ts`

9. **Create session-scoped screenshot routes**
   - `src/app/api/projects/[id]/sessions/[sessionId]/screenshots/route.ts`

10. **Update export route**
    - Support exporting single session or all sessions

### Phase 4: Frontend - Project Page

11. **Create SessionCard component**
    - File: `src/components/SessionCard.tsx`
    - Display: title, creation date, feedback count, screenshot count
    - Actions: edit title, delete session

12. **Create CreateSessionModal component**
    - File: `src/components/CreateSessionModal.tsx`
    - Form: session title input
    - Auto-generate default title: "Session - {date}"

13. **Redesign project page**
    - File: `src/app/projects/[id]/page.tsx`
    - Show project header with name/URL
    - List sessions with SessionCard components
    - "New Session" button → CreateSessionModal
    - Empty state when no sessions

### Phase 5: Frontend - Session Page

14. **Create session detail page**
    - File: `src/app/projects/[id]/sessions/[sessionId]/page.tsx`
    - Move existing project page UI here
    - Update all API calls to use sessionId routes

15. **Update MiniBrowser component**
    - Accept `sessionId` prop instead of `projectId`
    - Update screenshot capture to use session route

16. **Update FeedbackPanel component**
    - Accept `sessionId` prop
    - Update feedback/screenshot fetching to use session routes
    - Add breadcrumb navigation back to project

### Phase 6: State Management

17. **Update Zustand store**
    - Add `sessions: FeedbackSession[]`
    - Add `currentSession: FeedbackSession | null`
    - Add session actions: `setSessions`, `setCurrentSession`, `addSession`, `updateSession`, `deleteSession`
    - Update feedback actions to work with sessions

### Phase 7: Polish & Migration

18. **Update navigation**
    - Dashboard → Project list (unchanged)
    - Project card → Sessions list (updated)
    - Session card → Session detail (new)
    - Add back navigation from session to project

19. **Handle edge cases**
    - Empty sessions list UI
    - Session deletion confirmation
    - Update export functionality

20. **Test migration**
    - Verify existing data migrates correctly
    - Test all CRUD operations
    - Test cascading deletes

---

## New Route Structure

```
/                                           → Dashboard (project list)
/projects/[id]                              → Project detail (sessions list)  [CHANGED]
/projects/[id]/sessions/[sessionId]         → Session detail (feedback UI)    [NEW]
```

### API Routes

```
GET    /api/projects                        → List projects
POST   /api/projects                        → Create project
GET    /api/projects/[id]                   → Get project with sessions
PATCH  /api/projects/[id]                   → Update project
DELETE /api/projects/[id]                   → Delete project (cascades)

GET    /api/projects/[id]/sessions          → List sessions           [NEW]
POST   /api/projects/[id]/sessions          → Create session          [NEW]
GET    /api/projects/[id]/sessions/[sid]    → Get session            [NEW]
PATCH  /api/projects/[id]/sessions/[sid]    → Update session         [NEW]
DELETE /api/projects/[id]/sessions/[sid]    → Delete session         [NEW]

GET    /api/projects/[id]/sessions/[sid]/feedback          → List feedback    [NEW PATH]
POST   /api/projects/[id]/sessions/[sid]/feedback          → Create feedback  [NEW PATH]
PATCH  /api/projects/[id]/sessions/[sid]/feedback/[fid]    → Update feedback  [NEW PATH]
DELETE /api/projects/[id]/sessions/[sid]/feedback/[fid]    → Delete feedback  [NEW PATH]

POST   /api/projects/[id]/sessions/[sid]/screenshots       → Create screenshot [NEW PATH]
GET    /api/projects/[id]/sessions/[sid]/screenshots       → List screenshots  [NEW PATH]

# Unchanged
PATCH  /api/screenshots/[id]                → Update screenshot
DELETE /api/screenshots/[id]                → Delete screenshot
POST   /api/screenshots/[id]/annotations    → Create annotation
GET    /api/screenshots/[id]/annotations    → List annotations
PATCH  /api/screenshots/[id]/annotations/[aid]  → Update annotation
DELETE /api/screenshots/[id]/annotations/[aid]  → Delete annotation
```

---

## Considerations

### Security
- Validate sessionId belongs to projectId in all session-scoped routes
- Maintain cascading deletes for data integrity

### Performance
- Add index on `FeedbackSession.projectId` for efficient listing
- Add index on `Feedback.sessionId` and `Screenshot.sessionId`
- Consider pagination for projects with many sessions

### Migration Strategy
1. Create migration that:
   - Adds FeedbackSession table
   - For each existing Project, creates a default session titled "Initial Session"
   - Updates Feedback records to point to the new session
   - Updates Screenshot records to point to the new session
   - Removes old foreign key columns after data migration

2. SQL Migration (in Prisma migration):
```sql
-- Create FeedbackSession table
CREATE TABLE "FeedbackSession" (...);

-- Create default session for each project
INSERT INTO "FeedbackSession" (id, projectId, title, createdAt, updatedAt)
SELECT
  'session_' || id,
  id,
  'Initial Session',
  createdAt,
  datetime('now')
FROM "Project";

-- Add sessionId to Feedback and migrate data
ALTER TABLE "Feedback" ADD COLUMN "sessionId" TEXT;
UPDATE "Feedback" SET "sessionId" = 'session_' || "projectId";

-- Add sessionId to Screenshot and migrate data
ALTER TABLE "Screenshot" ADD COLUMN "sessionId" TEXT;
UPDATE "Screenshot" SET "sessionId" = 'session_' || "projectId";

-- Drop old columns and add constraints
-- (Prisma handles this via migration steps)
```

### Testing Approach
- Unit tests for new database utilities
- API route testing for session CRUD
- E2E testing for new user flows:
  - Create project → Create session → Add feedback
  - Navigate between sessions
  - Delete session (verify cascade)

### Backward Compatibility
- Old `/api/projects/[id]/feedback` routes should be deprecated/removed
- Update any external integrations (Chrome extension) if needed
- The Chrome extension may need updates if it directly calls feedback APIs

---

## File Changes Summary

### New Files
- `src/lib/db/sessions.ts`
- `src/app/api/projects/[id]/sessions/route.ts`
- `src/app/api/projects/[id]/sessions/[sessionId]/route.ts`
- `src/app/api/projects/[id]/sessions/[sessionId]/feedback/route.ts`
- `src/app/api/projects/[id]/sessions/[sessionId]/feedback/[feedbackId]/route.ts`
- `src/app/api/projects/[id]/sessions/[sessionId]/screenshots/route.ts`
- `src/app/projects/[id]/sessions/[sessionId]/page.tsx`
- `src/components/SessionCard.tsx`
- `src/components/CreateSessionModal.tsx`

### Modified Files
- `prisma/schema.prisma`
- `src/lib/db/feedback.ts`
- `src/lib/db/screenshots.ts`
- `src/lib/store/useStore.ts`
- `src/app/projects/[id]/page.tsx`
- `src/components/MiniBrowser.tsx`
- `src/components/FeedbackPanel.tsx`

### Deleted Files (after migration)
- `src/app/api/projects/[id]/feedback/route.ts`
- `src/app/api/projects/[id]/feedback/[feedbackId]/route.ts`
- `src/app/api/projects/[id]/screenshots/route.ts`

---

## Estimated Effort

| Phase | Description | Complexity |
|-------|-------------|------------|
| 1 | Database Schema Changes | Medium |
| 2 | Database Utilities | Low |
| 3 | API Routes | Medium |
| 4 | Project Page Redesign | Medium |
| 5 | Session Page | Low (mostly moving code) |
| 6 | State Management | Low |
| 7 | Polish & Migration | Medium |

**Total: 20 implementation steps across 7 phases**
