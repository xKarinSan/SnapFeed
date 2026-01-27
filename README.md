# UI Feedback Collector

A real-time collaborative tool for collecting UI feedback during meetings. Embed any website in a mini browser, capture screenshots, add annotations, and collect feedback from multiple participants simultaneously.

## Features

- **Mini Browser**: Embed and browse any website within the app
- **Screenshot Capture**: Capture the current state of embedded sites (with Chrome extension for seamless experience)
- **Real-time Collaboration**: Multiple users can join the same project and see updates in real-time via WebSocket
- **Feedback Management**: Create, edit, and organize feedback items
- **Session Management**: Track participants and manage feedback sessions

## Prerequisites

- Node.js 18+
- npm or yarn
- Chrome browser (for extension features)

## Installation

1. **Clone and install dependencies:**
   ```bash
   cd ui-feedback-collector
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

## Chrome Extension Setup (Recommended)

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
| `DATABASE_URL` | Database connection string | Yes |
| `NEXT_PUBLIC_EXTENSION_ID` | Chrome extension ID for screenshots | No |

## Project Structure

```
ui-feedback-collector/
├── extension/           # Chrome extension for screenshot capture
│   ├── manifest.json
│   └── background.js
├── prisma/              # Database schema
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   │   └── MiniBrowser.tsx  # Embedded browser with screenshot
│   ├── lib/
│   │   ├── db/          # Database operations
│   │   ├── socket/      # WebSocket event types
│   │   └── store/       # Zustand state management
│   └── ...
├── server.ts            # Custom server with Socket.IO
└── uploads/             # Screenshot storage
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Prisma ORM
- **Real-time**: Socket.IO
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Runtime**: TypeScript

## Development

```bash
# Run development server
npm run dev

# Run Next.js only (without custom server)
npm run dev:next

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Screenshot shows whole tab instead of iframe content
- Check the extension service worker logs: `chrome://extensions/` > Click "service worker"
- Verify `NEXT_PUBLIC_EXTENSION_ID` matches your extension's ID
- Reload the extension after making changes to `background.js`

### Extension not detected
- Ensure the extension is loaded and enabled in `chrome://extensions/`
- Check that `externally_connectable` in `manifest.json` includes your dev server URL
- Verify the extension ID in `.env.local` is correct

### Real-time updates not working
- Ensure the custom server is running (`npm run dev`, not `npm run dev:next`)
- Check browser console for WebSocket connection errors
