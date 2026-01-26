# UI Feedback Collector - Architecture Diagrams

This document contains architecture diagrams for the UI Feedback Collector application, a real-time collaborative tool for gathering UI feedback during meetings.

---

## System Context

High-level view showing the system and its interactions with users and external systems.

```mermaid
C4Context
    title System Context Diagram - UI Feedback Collector

    Person(reviewer, "Reviewer", "Team member collecting or reviewing UI feedback")
    Person(facilitator, "Facilitator", "Meeting host managing feedback sessions")

    System(ufc, "UI Feedback Collector", "Real-time collaborative feedback collection tool for web UI review")
    System(extension, "Chrome Extension", "Browser extension for seamless screenshot capture")

    System_Ext(target_site, "Target Website", "External website being reviewed for UI feedback")

    Rel(reviewer, ufc, "Views UI, submits feedback, annotates screenshots", "HTTPS/WebSocket")
    Rel(facilitator, ufc, "Creates projects, manages sessions, exports reports", "HTTPS/WebSocket")
    Rel(ufc, extension, "Requests screenshots", "chrome.runtime")
    Rel(extension, target_site, "Captures visible tab content", "Browser API")
```

### Legend
- **Reviewer**: Any team member participating in the feedback session
- **Facilitator**: The person who creates projects and manages the feedback collection
- **UI Feedback Collector**: The main application
- **Chrome Extension**: Optional extension for seamless screenshot capture
- **Target Website**: The external website being reviewed

### Assumptions
- Multiple users can participate in the same feedback session simultaneously
- Target website is embedded in an iframe within the app
- Chrome extension enables instant screenshots; falls back to Screen Capture API
- Users access the system through Chrome browser (for extension features)

---

## Container Diagram

Shows the major technical building blocks and how they interact.

```mermaid
C4Container
    title Container Diagram - UI Feedback Collector

    Person(user, "User", "Reviewer or Facilitator")

    Container_Boundary(app, "UI Feedback Collector") {
        Container(spa, "React SPA", "Next.js/React", "Single-page application providing the feedback collection UI")
        Container(server, "Node.js Server", "Next.js + Socket.io", "Handles HTTP requests and WebSocket connections")
        Container(api, "REST API", "Next.js API Routes", "Provides CRUD operations for projects, feedback, screenshots")
        ContainerDb(db, "SQLite Database", "Prisma ORM", "Stores projects, feedback, sessions, screenshots, annotations")
        Container(fs, "File Storage", "Local filesystem", "Stores captured screenshot images")
    }

    Container_Boundary(browser, "User Browser") {
        Container(extension, "Chrome Extension", "Manifest V3", "Captures visible tab screenshots via captureVisibleTab API")
    }

    System_Ext(target, "Target Website", "Website being reviewed (embedded in iframe)")

    Rel(user, spa, "Uses", "HTTPS")
    Rel(user, server, "Real-time events", "WebSocket")
    Rel(spa, api, "API calls", "HTTP/JSON")
    Rel(spa, extension, "Screenshot request", "chrome.runtime.sendMessage")
    Rel(server, api, "Routes requests", "Internal")
    Rel(api, db, "Reads/writes", "Prisma")
    Rel(api, fs, "Stores screenshots", "File I/O")
    Rel(extension, spa, "Returns cropped screenshot", "dataUrl")
    Rel(spa, target, "Embeds in iframe", "HTTPS")
```

### Legend
- **React SPA**: Client-side application built with Next.js and React
- **Node.js Server**: Custom HTTP server wrapping Next.js with Socket.io
- **REST API**: Next.js API routes for data operations
- **SQLite Database**: File-based database using Prisma ORM
- **File Storage**: Local directory for screenshot PNG files
- **Chrome Extension**: Browser extension for seamless screenshot capture

### Assumptions
- Single-server deployment (not distributed)
- SQLite is sufficient for expected data volume
- Chrome extension is optional (fallback to Screen Capture API)

---

## Component Diagram - Frontend

Detailed view of the React frontend components and their relationships.

```mermaid
flowchart TB
    subgraph Pages["Pages (Next.js App Router)"]
        dashboard["/page.tsx<br/>Dashboard"]
        project["/projects/[id]/page.tsx<br/>Project Detail"]
    end

    subgraph Components["UI Components"]
        minibrowser["MiniBrowser<br/>URL viewer + screenshot"]
        feedbackpanel["FeedbackPanel<br/>Feedback list sidebar"]
        feedbackform["FeedbackForm<br/>Submit feedback modal"]
        feedbackcanvas["FeedbackCanvas<br/>Pin overlay layer"]
        feedbackpin["FeedbackPin<br/>Visual marker"]
        screenshotgallery["ScreenshotGallery<br/>Screenshot list"]
        screenshotviewer["ScreenshotViewer<br/>View + annotate"]
        annotationcanvas["AnnotationCanvas<br/>Annotation overlay"]
        annotationpin["AnnotationPin<br/>Annotation marker"]
        joinsession["JoinSession<br/>User name modal"]
        projectcard["ProjectCard<br/>Project list item"]
        createmodal["CreateProjectModal<br/>New project form"]
    end

    subgraph State["State Management"]
        zustand["Zustand Store<br/>Global client state"]
        socketclient["Socket.io Client<br/>Real-time connection"]
    end

    subgraph Hooks["Custom Hooks"]
        userealtimefeedback["useRealtimeFeedback<br/>Socket event handler"]
    end

    dashboard --> projectcard
    dashboard --> createmodal
    project --> minibrowser
    project --> feedbackpanel
    project --> feedbackcanvas
    project --> screenshotgallery
    project --> joinsession

    feedbackpanel --> feedbackpin
    feedbackcanvas --> feedbackpin
    feedbackpanel --> feedbackform

    screenshotgallery --> screenshotviewer
    screenshotviewer --> annotationcanvas
    annotationcanvas --> annotationpin

    project --> userealtimefeedback
    userealtimefeedback --> socketclient
    userealtimefeedback --> zustand

    minibrowser --> zustand
    feedbackpanel --> zustand
    screenshotgallery --> zustand
```

### Legend
- **Pages**: Next.js App Router page components
- **UI Components**: React components for UI rendering
- **State Management**: Client-side state (Zustand) and real-time communication (Socket.io)
- **Custom Hooks**: React hooks for business logic

### Assumptions
- Zustand store is the single source of truth for client state
- Socket.io handles all real-time synchronization
- Components follow a hierarchical composition pattern

---

## Component Diagram - Backend

Shows the server-side components and data access layer.

```mermaid
flowchart TB
    subgraph Server["Custom Server (server.ts)"]
        httpserver["HTTP Server<br/>Node.js http module"]
        nexthandler["Next.js Handler<br/>SSR + API routing"]
        socketio["Socket.io Server<br/>WebSocket handling"]
    end

    subgraph API["API Routes (/api)"]
        subgraph ProjectsAPI["Projects"]
            projectslist["GET/POST /projects"]
            projectsingle["GET/PATCH/DELETE /projects/[id]"]
        end
        subgraph FeedbackAPI["Feedback"]
            feedbacklist["GET/POST /projects/[id]/feedback"]
            feedbacksingle["GET/PATCH/DELETE /projects/[id]/feedback/[feedbackId]"]
        end
        subgraph ScreenshotsAPI["Screenshots"]
            screenshotslist["GET/POST /projects/[id]/screenshots"]
            screenshotsingle["GET/DELETE /screenshots/[id]"]
            annotationslist["GET/POST /screenshots/[id]/annotations"]
            annotationsingle["PATCH/DELETE /screenshots/[id]/annotations/[annotationId]"]
        end
        subgraph ExportAPI["Export"]
            exportmd["GET /projects/[id]/export"]
        end
        subgraph UploadsAPI["Static Files"]
            uploadsserve["GET /uploads/screenshots/[...path]"]
        end
    end

    subgraph Database["Database Layer (/lib/db)"]
        prisma["Prisma Client<br/>ORM singleton"]
        projectsdb["projects.ts<br/>Project queries"]
        feedbackdb["feedback.ts<br/>Feedback queries"]
        screenshotsdb["screenshots.ts<br/>Screenshot queries"]
        annotationsdb["annotations.ts<br/>Annotation queries"]
    end

    subgraph External["External Services"]
        puppeteer["Puppeteer<br/>Headless Chrome"]
        sqlite["SQLite<br/>Database file"]
        filesystem["Filesystem<br/>/uploads/screenshots"]
    end

    httpserver --> nexthandler
    httpserver --> socketio

    nexthandler --> API

    ProjectsAPI --> projectsdb
    FeedbackAPI --> feedbackdb
    ScreenshotsAPI --> screenshotsdb
    ScreenshotsAPI --> annotationsdb
    ScreenshotsAPI --> puppeteer
    ExportAPI --> projectsdb
    ExportAPI --> feedbackdb
    UploadsAPI --> filesystem

    projectsdb --> prisma
    feedbackdb --> prisma
    screenshotsdb --> prisma
    annotationsdb --> prisma

    prisma --> sqlite
    puppeteer --> filesystem
```

### Legend
- **Custom Server**: Node.js HTTP server with Next.js and Socket.io integration
- **API Routes**: RESTful endpoints following Next.js App Router conventions
- **Database Layer**: Prisma-based data access functions
- **External Services**: SQLite database, filesystem, and Puppeteer

### Assumptions
- Single Prisma client instance (singleton pattern)
- API routes handle validation and error responses
- Screenshot files are stored locally (not cloud storage)

---

## Sequence Diagram - Feedback Submission

Shows the flow when a user submits UI feedback.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant SPA as React SPA
    participant Store as Zustand Store
    participant WS as Socket.io Client
    participant API as REST API
    participant DB as SQLite
    participant Server as Socket.io Server
    participant Other as Other Users

    U->>SPA: Click on UI element
    SPA->>SPA: Capture position (x, y, viewport)
    SPA->>SPA: Open FeedbackForm modal
    U->>SPA: Enter feedback content
    U->>SPA: Submit feedback

    SPA->>API: POST /api/projects/[id]/feedback
    API->>DB: Insert feedback record
    DB-->>API: Return new feedback
    API-->>SPA: 201 Created (feedback data)

    SPA->>Store: Add feedback to local state
    Store-->>SPA: State updated
    SPA->>SPA: Render FeedbackPin

    SPA->>WS: Emit "feedback:created" event
    WS->>Server: WebSocket message
    Server->>Other: Broadcast to room
    Other->>Other: Update Zustand store
    Other->>Other: Render new FeedbackPin
```

### Legend
- **User Browser**: The user's web browser
- **React SPA**: The frontend application
- **Zustand Store**: Client-side state management
- **Socket.io Client/Server**: Real-time communication layer
- **REST API**: Backend API endpoints
- **SQLite**: Database storage

### Assumptions
- Feedback is persisted before broadcasting
- All users in the same project room receive updates
- Optimistic UI updates are applied locally first

---

## Sequence Diagram - Screenshot Capture (with Extension)

Shows the client-side screenshot capture flow using the Chrome extension.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SPA as React SPA
    participant Ext as Chrome Extension
    participant API as REST API
    participant FS as Filesystem
    participant DB as SQLite

    U->>SPA: Enter URL in MiniBrowser
    SPA->>SPA: Load target site in iframe
    U->>SPA: Interact with embedded site
    U->>SPA: Click "Screenshot" button

    SPA->>SPA: Get iframe bounding rect
    SPA->>Ext: chrome.runtime.sendMessage
    Note over Ext: { action: "captureScreenshot", crop: { x, y, width, height, scale } }

    Ext->>Ext: captureVisibleTab()
    Ext->>Ext: Crop to iframe region
    Note over Ext: Using OffscreenCanvas
    Ext-->>SPA: { dataUrl: "data:image/png;base64,..." }

    SPA->>API: POST /api/projects/[id]/screenshots
    Note over API: { dataUrl, pageUrl, sessionId }

    API->>API: Decode base64 to buffer
    API->>FS: Write PNG to /uploads/screenshots/
    FS-->>API: File path

    API->>DB: Insert screenshot record
    DB-->>API: Return screenshot data

    API-->>SPA: 201 Created (screenshot metadata)
    SPA->>SPA: Update ScreenshotGallery
```

### Legend
- **User**: The user interacting with the app
- **React SPA**: The frontend MiniBrowser component
- **Chrome Extension**: Background service worker with captureVisibleTab permission
- **REST API**: Backend screenshot endpoint
- **Filesystem**: Local file storage
- **SQLite**: Database for metadata

### Assumptions
- Chrome extension is installed and configured
- Extension has `host_permissions: ["<all_urls>"]`
- devicePixelRatio is used for correct scaling on HiDPI displays
- Cropping happens in the extension before sending to the app

---

## Sequence Diagram - Screenshot Capture (Fallback)

Shows the fallback flow when Chrome extension is not available.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SPA as React SPA
    participant Browser as Browser API
    participant API as REST API
    participant FS as Filesystem
    participant DB as SQLite

    U->>SPA: Click "Screenshot" button
    SPA->>SPA: Check extension availability
    Note over SPA: Extension not detected

    SPA->>Browser: getDisplayMedia()
    Browser->>U: Show share dialog
    U->>Browser: Select current tab
    Browser-->>SPA: MediaStream

    SPA->>SPA: Create video element
    SPA->>SPA: Draw frame to canvas
    SPA->>SPA: Get bounding rect
    SPA->>SPA: Crop to iframe region
    SPA->>SPA: canvas.toDataURL()

    SPA->>API: POST /api/projects/[id]/screenshots
    Note over API: { dataUrl, pageUrl, sessionId }

    API->>FS: Write PNG file
    API->>DB: Insert record
    API-->>SPA: 201 Created
```

### Legend
- **Browser API**: Screen Capture API (getDisplayMedia)
- Dialog is shown to user for permission

### Assumptions
- User must grant screen share permission each time
- Only works on HTTPS or localhost
- May capture browser UI momentarily before cropping

---

## Sequence Diagram - Real-time Session Sync

Shows how multiple users stay synchronized in a session.

```mermaid
sequenceDiagram
    autonumber
    participant U1 as User 1 (Joins)
    participant U2 as User 2 (Existing)
    participant SPA1 as SPA (User 1)
    participant SPA2 as SPA (User 2)
    participant Server as Socket.io Server
    participant DB as SQLite

    Note over U1,DB: User 1 joins an existing session

    U1->>SPA1: Open project page
    SPA1->>SPA1: Show JoinSession modal
    U1->>SPA1: Enter display name

    SPA1->>Server: Emit "room:join"
    Note over Server: { projectId, displayName }

    Server->>DB: Create/update session record
    Server->>Server: Add to roomParticipants Map
    Server->>SPA1: Emit "room:joined"
    Note over SPA1: { participants: [...] }

    Server->>SPA2: Emit "participant:joined"
    Note over SPA2: { displayName: "User 1" }

    SPA2->>SPA2: Update participant list

    Note over U1,DB: User 1 creates feedback

    U1->>SPA1: Submit feedback
    SPA1->>Server: Emit "feedback:created"
    Server->>SPA2: Broadcast "feedback:created"
    SPA2->>SPA2: Add to Zustand store
    SPA2->>SPA2: Render new pin

    Note over U1,DB: User 1 leaves

    U1->>SPA1: Close browser/navigate away
    SPA1->>Server: Socket disconnect
    Server->>Server: Remove from roomParticipants
    Server->>SPA2: Emit "participant:left"
    SPA2->>SPA2: Update participant list
```

### Legend
- **User 1/2**: Different users in the same session
- **SPA**: React frontend for each user
- **Socket.io Server**: Real-time event hub
- **SQLite**: Session persistence

### Assumptions
- Each project has its own Socket.io "room"
- Participants are tracked both in memory (Map) and database
- Disconnect events trigger cleanup automatically

---

## Data Model (ERD)

Entity-relationship diagram showing the database schema.

```mermaid
erDiagram
    PROJECT ||--o{ FEEDBACK : contains
    PROJECT ||--o{ SESSION : has
    PROJECT ||--o{ SCREENSHOT : contains
    SCREENSHOT ||--o{ ANNOTATION : has

    PROJECT {
        string id PK
        string name
        string url
        datetime createdAt
        datetime updatedAt
    }

    FEEDBACK {
        string id PK
        string projectId FK
        string type "ui | non-ui"
        string content
        string author
        float posX "nullable"
        float posY "nullable"
        int viewportWidth "nullable"
        int viewportHeight "nullable"
        string selector "nullable"
        datetime createdAt
        boolean resolved
    }

    SESSION {
        string id PK
        string projectId FK
        string displayName
        string socketId
        datetime joinedAt
        datetime lastSeen
    }

    SCREENSHOT {
        string id PK
        string projectId FK
        string sessionId
        string filename
        string pageUrl
        string pageTitle
        datetime createdAt
    }

    ANNOTATION {
        string id PK
        string screenshotId FK
        string content
        string author
        float posX
        float posY
        datetime createdAt
        datetime updatedAt
    }
```

### Legend
- **PROJECT**: Container for a feedback collection session
- **FEEDBACK**: Individual feedback items (UI or general)
- **SESSION**: Active user sessions per project
- **SCREENSHOT**: Captured page screenshots
- **ANNOTATION**: Comments on specific screenshots

### Assumptions
- UUIDs are used for all primary keys
- Feedback position is nullable (only set for UI feedback)
- Sessions track active WebSocket connections
- Cascade delete from PROJECT removes all related records

---

## Deployment Diagram

Shows the Docker-based deployment topology.

```mermaid
flowchart TB
    subgraph Host["Docker Host"]
        subgraph Container["feedback-collector Container"]
            node["Node.js 20 Alpine"]
            nextjs["Next.js App<br/>(Standalone build)"]
            socketio["Socket.io Server"]
            prisma["Prisma Client"]
            puppeteer_lib["Puppeteer + Chromium"]
        end

        subgraph Volume["Docker Volume: feedback-data"]
            sqlite[("SQLite DB<br/>/app/data/feedback.db")]
            uploads["Screenshots<br/>/app/uploads/screenshots"]
        end

        node --> nextjs
        node --> socketio
        nextjs --> prisma
        prisma --> sqlite
        nextjs --> puppeteer_lib
        puppeteer_lib --> uploads
    end

    subgraph External["External"]
        browser["User Browser"]
        target["Target Website"]
    end

    browser -->|"Port 3000<br/>HTTP/WebSocket"| Container
    puppeteer_lib -->|"HTTPS"| target
```

### Legend
- **Docker Host**: The machine running Docker
- **feedback-collector Container**: The application container
- **Docker Volume**: Persistent storage for database and screenshots
- **External**: Users and external websites

### Assumptions
- Single container deployment (not microservices)
- Persistent volume ensures data survives container restarts
- Port 3000 exposed for HTTP and WebSocket traffic
- Puppeteer uses bundled Chromium

---

## Component Diagram - Chrome Extension

Shows the Chrome extension architecture for screenshot capture.

```mermaid
flowchart TB
    subgraph Browser["Chrome Browser"]
        subgraph WebApp["Web App (localhost:3000)"]
            minibrowser["MiniBrowser Component"]
            iframe["Embedded iframe"]
        end

        subgraph Extension["Chrome Extension"]
            manifest["manifest.json<br/>Permissions & config"]
            background["background.js<br/>Service Worker"]

            subgraph APIs["Chrome APIs"]
                runtime["chrome.runtime<br/>Message handling"]
                tabs["chrome.tabs<br/>Tab capture"]
                offscreen["OffscreenCanvas<br/>Image cropping"]
            end
        end
    end

    minibrowser -->|"1. sendMessage<br/>{action, crop}"| runtime
    runtime --> background
    background -->|"2. captureVisibleTab()"| tabs
    tabs -->|"3. Full tab dataUrl"| background
    background -->|"4. Crop image"| offscreen
    offscreen -->|"5. Cropped dataUrl"| background
    background -->|"6. sendResponse"| minibrowser

    style Extension fill:#e1f5fe
    style WebApp fill:#fff3e0
```

### Legend
- **MiniBrowser Component**: React component managing iframe and screenshot button
- **manifest.json**: Extension configuration with permissions
- **background.js**: Service worker handling capture requests
- **Chrome APIs**: Browser APIs for messaging, tab capture, and image processing

### Configuration

```json
{
  "manifest_version": 3,
  "permissions": ["activeTab"],
  "host_permissions": ["<all_urls>"],
  "externally_connectable": {
    "matches": ["http://localhost:*/*"]
  }
}
```

### Assumptions
- Extension ID must be configured in web app via `NEXT_PUBLIC_EXTENSION_ID`
- `externally_connectable` restricts which origins can message the extension
- `host_permissions: ["<all_urls>"]` required for captureVisibleTab on any site

---

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Zustand |
| **Real-time** | Socket.io (WebSocket) |
| **Backend** | Node.js, Next.js API Routes |
| **Database** | SQLite + Prisma ORM |
| **Screenshot** | Chrome Extension (captureVisibleTab) with Screen Capture API fallback |
| **Deployment** | Docker + Docker Compose |

---

## File Structure Reference

```
ui-feedback-collector/
├── extension/            # Chrome extension for screenshots
│   ├── manifest.json     # Extension config (MV3)
│   └── background.js     # Service worker (captureVisibleTab)
├── src/
│   ├── app/              # Next.js App Router (pages + API)
│   ├── components/       # React UI components
│   │   └── MiniBrowser.tsx  # Iframe + extension integration
│   ├── hooks/            # Custom React hooks
│   └── lib/
│       ├── db/           # Prisma database functions
│       ├── socket/       # Socket.io client/events
│       ├── export/       # Markdown export
│       └── store/        # Zustand state store
├── prisma/               # Database schema + migrations
├── uploads/              # Screenshot file storage
├── server.ts             # Custom HTTP/Socket.io server
├── Dockerfile            # Container build config
└── docker-compose.yml    # Deployment config
```
