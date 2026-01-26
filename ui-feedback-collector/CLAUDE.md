# UI Feedback Collector

A real-time collaborative UI feedback collection tool built with Next.js.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.io for WebSocket communication
- **State**: Zustand for client-side state management
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/projects/       # REST API endpoints
│   └── projects/[id]/      # Project detail page
├── components/             # React components
├── hooks/                  # Custom React hooks
└── lib/
    ├── db/                 # Prisma database utilities
    ├── export/             # Markdown export functionality
    ├── socket/             # Socket.io client utilities
    └── store/              # Zustand store
```

## Commands

```bash
# Development (with custom server for Socket.io)
npm run dev

# Development (Next.js only, no WebSocket)
npm run dev:next

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Database

Uses Prisma with SQLite. Key models:
- **Project**: Contains feedback sessions with a target URL
- **Feedback**: UI or non-UI feedback with positioning data
- **Session**: Tracks connected users

To reset/migrate the database:
```bash
npx prisma migrate dev
npx prisma generate
```

## Key Patterns

- API routes use Next.js App Router conventions (`route.ts` files)
- Real-time updates flow through Socket.io events defined in `src/lib/socket/events.ts`
- The custom server (`server.ts`) wraps Next.js to add Socket.io support
