# SnapFeed - Architecture Diagrams

This document contains architecture diagrams for SnapFeed, a single-user tool for gathering UI feedback on web applications.

---

## System Context

High-level view showing the system and its interactions with the user and external systems.

```mermaid
C4Context
    title System Context Diagram - UI Feedback Collector

    Person(user, "User", "Collects UI feedback, captures screenshots, and exports reports")

    System(ufc, "UI Feedback Collector", "Single-user feedback collection tool for web UI review")
    System(extension, "Chrome Extension", "Browser extension for seamless screenshot capture")

    System_Ext(target_site, "Target Website", "External website being reviewed for UI feedback")

    Rel(user, ufc, "Views UI, submits feedback, annotates screenshots", "HTTPS")
    Rel(ufc, extension, "Requests screenshots", "chrome.runtime")
    Rel(extension, target_site, "Captures visible tab content", "Browser API")
```

### Legend
- **User**: The person collecting feedback on a website
- **UI Feedback Collector**: The main Next.js application
- **Chrome Extension**: Optional extension for seamless screenshot capture
- **Target Website**: The external website being reviewed

### Assumptions
- Single-user application (no real-time collaboration)
- Target website is embedded in an iframe within the app
- Chrome extension enables instant screenshots; falls back to Screen Capture API
- User accesses the system through Chrome browser (for extension features)

---

## Container Diagram

Shows the major technical building blocks and how they interact.

```mermaid
C4Container
    title Container Diagram - UI Feedback Collector

    Person(user, "User")

    Container_Boundary(app, "UI Feedback Collector") {
        Container(spa, "React SPA", "Next.js/React", "Single-page application providing the feedback collection UI")
        Container(api, "REST API", "Next.js API Routes", "Provides CRUD operations for projects, feedback, screenshots")
        ContainerDb(db, "SQLite Database", "Prisma ORM", "Stores projects, feedback, screenshots, annotations")
        Container(fs, "File Storage", "Local filesystem", "Stores captured screenshot images")
    }

    Container_Boundary(browser, "User Browser") {
        Container(extension, "Chrome Extension", "Manifest V3", "Captures visible tab screenshots via captureVisibleTab API")
    }

    System_Ext(target, "Target Website", "Website being reviewed (embedded in iframe)")

    Rel(user, spa, "Uses", "HTTPS")
    Rel(spa, api, "API calls", "HTTP/JSON")
    Rel(spa, extension, "Screenshot request", "chrome.runtime.sendMessage")
    Rel(api, db, "Reads/writes", "Prisma")
    Rel(api, fs, "Stores screenshots", "File I/O")
    Rel(extension, spa, "Returns cropped screenshot", "dataUrl")
    Rel(spa, target, "Embeds in iframe", "HTTPS")
```

### Legend
- **React SPA**: Client-side application built with Next.js and React
- **REST API**: Next.js API routes for data operations
- **SQLite Database**: File-based database using Prisma ORM
- **File Storage**: Local directory for screenshot PNG files
- **Chrome Extension**: Browser extension for seamless screenshot capture

### Assumptions
- Single-server deployment using standard Next.js server
- SQLite is sufficient for single-user data volume
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
        screenshotgallery["ScreenshotGallery<br/>Screenshot grid"]
        screenshotviewer["ScreenshotViewer<br/>View + annotate"]
        screenshotthumbnail["ScreenshotThumbnail<br/>Screenshot card"]
        annotationpin["AnnotationPin<br/>Annotation marker"]
        annotationform["AnnotationForm<br/>Annotation input"]
        annotationlist["AnnotationList<br/>Annotation sidebar"]
        projectcard["ProjectCard<br/>Project list item"]
        createmodal["CreateProjectModal<br/>New project form"]
        iframeviewer["IframeViewer<br/>Iframe content display"]
    end

    subgraph State["State Management"]
        zustand["Zustand Store<br/>Global client state"]
    end

    dashboard --> projectcard
    dashboard --> createmodal
    project --> minibrowser
    project --> feedbackpanel
    project --> screenshotgallery
    project --> feedbackform

    minibrowser --> iframeviewer
    feedbackpanel --> annotationpin

    screenshotgallery --> screenshotthumbnail
    screenshotthumbnail --> screenshotviewer
    screenshotviewer --> annotationpin
    screenshotviewer --> annotationlist
    screenshotviewer --> annotationform

    minibrowser --> zustand
    feedbackpanel --> zustand
    screenshotgallery --> zustand
```

### Legend
- **Pages**: Next.js App Router page components
- **UI Components**: React components for UI rendering
- **State Management**: Zustand for client-side state

### Assumptions
- Zustand store is the single source of truth for client state
- Components follow a hierarchical composition pattern
- Author is fixed as "User" for all feedback and annotations

---

## Component Diagram - Backend

Shows the server-side components and data access layer.

```mermaid
flowchart TB
    subgraph NextServer["Next.js Server"]
        nexthandler["Next.js Handler<br/>SSR + API routing"]
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
            screenshotsingle["GET/PATCH/DELETE /screenshots/[id]"]
            annotationslist["GET/POST /screenshots/[id]/annotations"]
            annotationsingle["PATCH/DELETE /screenshots/[id]/annotations/[annotationId]"]
        end
        subgraph ExportAPI["Export"]
            exportmd["GET /projects/[id]/export"]
        end
        subgraph UploadsAPI["Static Files"]
            uploadsserve["GET /uploads/screenshots/[filename]"]
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
        sqlite["SQLite<br/>Database file"]
        filesystem["Filesystem<br/>/uploads/screenshots"]
    end

    subgraph ExportLib["Export Libraries"]
        sharp["Sharp<br/>Image annotation"]
        pdflib["pdf-lib<br/>PDF generation"]
    end

    nexthandler --> API

    ProjectsAPI --> projectsdb
    FeedbackAPI --> feedbackdb
    ScreenshotsAPI --> screenshotsdb
    ScreenshotsAPI --> annotationsdb
    ExportAPI --> projectsdb
    ExportAPI --> screenshotsdb
    ExportAPI --> sharp
    ExportAPI --> pdflib
    UploadsAPI --> filesystem

    projectsdb --> prisma
    feedbackdb --> prisma
    screenshotsdb --> prisma
    annotationsdb --> prisma

    prisma --> sqlite
    sharp --> filesystem
```

### Legend
- **Next.js Server**: Standard Next.js development/production server
- **API Routes**: RESTful endpoints following Next.js App Router conventions
- **Database Layer**: Prisma-based data access functions
- **External Services**: SQLite database and filesystem storage
- **Export Libraries**: Sharp for image annotation, pdf-lib for PDF generation

### Assumptions
- Single Prisma client instance (singleton pattern)
- API routes handle validation and error responses
- Screenshot files are stored locally (not cloud storage)
- PDF export uses embedded fonts (no external font files)

---

## Sequence Diagram - Feedback Submission

Shows the flow when a user submits UI feedback.

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant SPA as React SPA
    participant Store as Zustand Store
    participant API as REST API
    participant DB as SQLite

    U->>SPA: Click on UI element
    SPA->>SPA: Capture position (x, y, viewport)
    SPA->>SPA: Open FeedbackForm modal
    U->>SPA: Enter feedback content
    U->>SPA: Submit feedback

    SPA->>API: POST /api/projects/[id]/feedback
    Note over API: { type, content, author: "User", posX, posY, ... }
    API->>DB: Insert feedback record
    DB-->>API: Return new feedback
    API-->>SPA: 201 Created (feedback data)

    SPA->>Store: Add feedback to local state
    Store-->>SPA: State updated
    SPA->>SPA: Render FeedbackPin
```

### Legend
- **User Browser**: The user's web browser
- **React SPA**: The frontend application
- **Zustand Store**: Client-side state management
- **REST API**: Backend API endpoints
- **SQLite**: Database storage

### Assumptions
- Feedback is persisted to database before updating UI
- Author is always "User" (single-user mode)
- Position data is stored as percentages for viewport independence

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
    Ext-->>SPA: Cropped screenshot as base64 dataUrl

    SPA->>API: POST /api/projects/[id]/screenshots
    Note over API: { dataUrl, pageUrl, sessionId: "user" }

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
    Note over API: { dataUrl, pageUrl, sessionId: "user" }

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

## Data Model (ERD)

Entity-relationship diagram showing the database schema.

```mermaid
erDiagram
    PROJECT ||--o{ FEEDBACK : contains
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
- **SCREENSHOT**: Captured page screenshots
- **ANNOTATION**: Comments on specific screenshots

### Assumptions
- CUIDs are used for all primary keys
- Feedback position is nullable (only set for UI feedback)
- Cascade delete from PROJECT removes all related records
- Author is always "User" for single-user mode

---

## Sequence Diagram - Export Flow

Shows the flow when a user exports feedback to Markdown or PDF.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SPA as React SPA
    participant API as Export API
    participant DB as SQLite
    participant FS as Filesystem
    participant Export as Export Module

    U->>SPA: Click "Export (.md)" or "Export (.pdf)"
    SPA->>API: GET /api/projects/[id]/export?format=markdown|pdf

    API->>DB: Fetch project with feedbacks
    DB-->>API: Project data

    API->>DB: Fetch screenshots with annotations
    DB-->>API: Screenshots + annotations

    loop For each screenshot
        API->>FS: Read image file
        FS-->>API: Image buffer
        API->>API: Annotate image with markers (Sharp)
        API->>API: Convert to base64
    end

    alt format = markdown
        API->>Export: generateMarkdownExport(data)
        Export-->>API: Markdown string
        API-->>SPA: Content-Type: text/markdown
    else format = pdf
        API->>Export: generatePdfExport(data)
        Note over Export: Uses pdf-lib with embedded fonts
        Export-->>API: PDF buffer
        API-->>SPA: Content-Type: application/pdf
    end

    SPA->>SPA: Create blob URL
    SPA->>U: Download file
```

### Legend
- **Export API**: `/api/projects/[id]/export` route
- **Export Module**: `src/lib/export/markdown.ts` and `src/lib/export/pdf.ts`
- **Sharp**: Image processing library for annotation markers

### Assumptions
- Screenshots are annotated with numbered markers at annotation positions
- PDF uses pdf-lib with embedded StandardFonts (Helvetica)
- Export is self-contained (images embedded as base64)

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
| **Backend** | Next.js API Routes |
| **Database** | SQLite + Prisma ORM |
| **Screenshot** | Chrome Extension (captureVisibleTab) with Screen Capture API fallback |
| **Image Processing** | Sharp (annotation markers) |
| **Export** | pdf-lib (PDF), custom markdown generator |

---

## File Structure Reference

```
SnapFeed/
├── extension/              # Chrome extension for screenshots
│   ├── manifest.json       # Extension config (MV3)
│   └── background.js       # Service worker (captureVisibleTab)
├── src/
│   ├── app/                # Next.js App Router (pages + API)
│   │   ├── api/            # REST API routes
│   │   │   ├── projects/   # Project and feedback endpoints
│   │   │   ├── screenshots/# Screenshot and annotation endpoints
│   │   │   └── uploads/    # Static file serving
│   │   ├── projects/[id]/  # Project detail page
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Dashboard
│   ├── components/         # React UI components
│   │   ├── MiniBrowser.tsx       # Iframe + extension integration
│   │   ├── FeedbackPanel.tsx     # Feedback sidebar
│   │   ├── FeedbackForm.tsx      # Feedback input modal
│   │   ├── ScreenshotGallery.tsx # Screenshot grid
│   │   ├── ScreenshotViewer.tsx  # Full screenshot view
│   │   ├── ScreenshotThumbnail.tsx
│   │   ├── AnnotationPin.tsx     # Position markers
│   │   ├── AnnotationForm.tsx
│   │   ├── AnnotationList.tsx
│   │   ├── IframeViewer.tsx
│   │   ├── ProjectCard.tsx
│   │   └── CreateProjectModal.tsx
│   └── lib/
│       ├── db/             # Prisma database functions
│       │   ├── prisma.ts
│       │   ├── projects.ts
│       │   ├── feedback.ts
│       │   ├── screenshots.ts
│       │   └── annotations.ts
│       ├── export/         # Export functionality
│       │   ├── markdown.ts       # Markdown generation
│       │   ├── pdf.ts            # PDF generation (pdf-lib)
│       │   └── annotateImage.ts  # Image annotation (Sharp)
│       └── store/
│           └── useStore.ts # Zustand state store
├── prisma/
│   └── schema.prisma       # Database schema
├── uploads/screenshots/    # Screenshot file storage
└── package.json            # Dependencies and scripts
```
