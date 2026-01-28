# SnapFeed

A single-user UI feedback collection tool built with Next.js. Embed any website in a mini browser, capture screenshots, add annotations, and organize feedback for design reviews.

## Features

- **Mini Browser**: Embed and browse any website within the app
- **Screenshot Capture**: Capture the current state of embedded sites (with optional Chrome extension for seamless experience)
- **Screenshot Annotations**: Add positioned annotations directly on captured screenshots
- **Feedback Management**: Create UI feedback (with position) or general notes, mark items as resolved
- **Export**: Export projects as Markdown or PDF with embedded annotated screenshots

## Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser (optional, for extension features)

## Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd SnapFeed
   npm install
   ```

2. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Chrome Extension Setup (Optional)

The Chrome extension enables seamless screenshot capture without browser permission dialogs.

### Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension` folder from this project
5. Copy the **Extension ID** shown (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Configure the App

Add the extension ID to your `.env.local`:

```env
NEXT_PUBLIC_EXTENSION_ID=your-extension-id-here
```

Restart the development server for changes to take effect.

### How It Works

| With Extension | Without Extension |
|----------------|-------------------|
| Instant screenshot capture | Shows browser share dialog |
| No user interaction needed | User must select tab to share |
| Captures only iframe content | Captures and crops to iframe |

The app automatically detects if the extension is available and falls back to the Screen Capture API if not.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `NEXT_PUBLIC_EXTENSION_ID` | Chrome extension ID for screenshots | No |

## Project Structure

```
SnapFeed/
├── extension/           # Chrome extension for screenshot capture
│   ├── manifest.json
│   └── background.js
├── prisma/              # Database schema
│   └── schema.prisma
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # REST API endpoints
│   │   │   └── projects/
│   │   └── projects/    # Project detail page
│   ├── components/      # React components
│   │   ├── MiniBrowser.tsx
│   │   ├── FeedbackPanel.tsx
│   │   ├── ScreenshotGallery.tsx
│   │   └── ...
│   └── lib/
│       ├── db/          # Prisma database utilities
│       ├── export/      # Markdown/PDF export
│       └── store/       # Zustand state management
└── uploads/             # Screenshot storage
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Reset database
npx prisma migrate reset
npx prisma generate
```

## Usage

1. **Create a Project**: Click "New Project" and enter a name and target URL
2. **Browse**: Use the mini browser to navigate the target site
3. **Capture Screenshots**: Click the camera icon to capture the current view
4. **Add Feedback**:
   - Click on the screenshot to add positioned UI feedback
   - Use the feedback panel to add general notes
5. **Annotate Screenshots**: View screenshots and add annotations at specific points
6. **Export**: Download your feedback as Markdown or PDF

## Troubleshooting

### Screenshot shows whole tab instead of iframe content
- Check the extension service worker logs: `chrome://extensions/` > Click "service worker"
- Verify `NEXT_PUBLIC_EXTENSION_ID` matches your extension's ID
- Reload the extension after making changes to `background.js`

### Extension not detected
- Ensure the extension is loaded and enabled in `chrome://extensions/`
- Check that `externally_connectable` in `manifest.json` includes your dev server URL
- Verify the extension ID in `.env.local` is correct

### Database errors
- Run `npx prisma generate` to regenerate the Prisma client
- Run `npx prisma db push` to sync the database schema
