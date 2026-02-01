# SnapFeed

A single-user UI feedback and screenshot collection tool built with Next.js.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
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
    └── store/              # Zustand store
```

## Commands

```bash
# Development
npm run dev

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
- **Screenshot**: Captured screenshots with annotations

To reset/migrate the database:
```bash
npx prisma migrate dev
npx prisma generate
```

## Key Patterns

- API routes use Next.js App Router conventions (`route.ts` files)
- State management via Zustand store in `src/lib/store/useStore.ts`

## Documentation

- `docs/FIXES.md` - Bug fixes and solutions for common issues
