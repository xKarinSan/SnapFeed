# Fixes

## Localhost Realtime Feature Not Working

**File:** `src/lib/browser/BrowserSessionManager.ts`

**Problems:**
1. Internal URLs (localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x) were blocked by security filter
2. URLs without protocol defaulted to `https://`, but localhost dev servers use `http://`

**Solutions:**
1. Added `ALLOW_INTERNAL_URLS` flag (default: true) - set `BLOCK_INTERNAL_URLS=true` env var to restrict
2. URLs for localhost/internal addresses now default to `http://` instead of `https://`

## Screenshot Capture - Whole Tab Instead of Iframe Content

**Date:** 2026-01-27

**Files:** `ui-feedback-collector/extension/background.js`, `ui-feedback-collector/src/components/MiniBrowser.tsx`

**Problem:**
The screenshot feature was capturing the entire browser tab instead of just the iframe content (the embedded app area).

**Root Cause:**
The Chrome extension's `captureVisibleTab` API captures the entire visible tab. The cropping logic needed to extract only the iframe region based on coordinates passed from the web app.

**Solution:**
1. Added detailed logging to `background.js` to debug crop calculations
2. Added bounds validation and clamping to prevent crop coordinates from exceeding image dimensions
3. Used `Math.round()` on crop coordinates to avoid sub-pixel issues

**Key Code Changes:**
```javascript
// Calculate scaled crop dimensions with rounding
const cropX = Math.round(x * scale);
const cropY = Math.round(y * scale);
const cropWidth = Math.round(width * scale);
const cropHeight = Math.round(height * scale);

// Clamp values to image bounds
const finalCropX = Math.max(0, Math.min(cropX, bitmap.width));
const finalCropY = Math.max(0, Math.min(cropY, bitmap.height));
const finalCropWidth = Math.min(cropWidth, bitmap.width - finalCropX);
const finalCropHeight = Math.min(cropHeight, bitmap.height - finalCropY);
```

**How to Debug:**
1. Go to `chrome://extensions/`
2. Find "UI Feedback Collector Screenshot" extension
3. Click "service worker" link under "Inspect views"
4. Check Console tab for crop dimension logs

## PDF Export - Font File Not Found (pdfkit)

**Date:** 2026-01-28

**Files:** `src/lib/export/pdf.ts`, `package.json`, `next.config.js`

**Problem:**
PDF export failed with error:
```
ENOENT: no such file or directory, open '.next/server/vendor-chunks/data/Helvetica.afm'
```

**Root Cause:**
The `pdfkit` library relies on external AFM font files that get bundled incorrectly by Next.js webpack. The bundler changes the file paths, causing pdfkit to look for fonts in the wrong location (`.next/server/vendor-chunks/data/` instead of `node_modules/pdfkit/js/data/`).

**Attempted Solutions That Failed:**
1. `serverExternalPackages: ['pdfkit']` in next.config.js - did not prevent webpack bundling
2. Manually copying font files to `.next/server/vendor-chunks/data/` - files got overwritten on rebuild

**Solution:**
Replaced `pdfkit` with `pdf-lib` which embeds fonts properly and doesn't rely on external AFM files.

```bash
npm uninstall pdfkit @types/pdfkit
npm install pdf-lib
```

**Key Differences (pdfkit vs pdf-lib):**
| Feature | pdfkit | pdf-lib |
|---------|--------|---------|
| Font handling | External AFM files | Embedded StandardFonts |
| Next.js compatibility | Requires workarounds | Works out of the box |
| API style | Streaming/chainable | Promise-based |
| Bundle size | Smaller (fonts external) | Larger (fonts embedded) |

## Single-User Architecture Refactor

**Date:** 2026-01-29

**Files:** Multiple files across `src/app/`, `src/components/`, `src/lib/store/`

**Problem:**
The application was originally built with multi-user real-time collaboration features (Socket.IO) that added unnecessary complexity for single-user workflows. This caused:
- Extra overhead from WebSocket connections
- Confusing session/participant management UI
- Complex state synchronization logic

**Solution:**
Refactored to single-user architecture:
1. Removed Socket.IO and real-time collaboration
2. Simplified author to hardcoded "User" value
3. Removed `FeedbackCanvas.tsx` - overlay layer for placing feedback pins (functionality consolidated)
4. Removed `FeedbackPin.tsx` - separate pin component (consolidated into `AnnotationPin.tsx`)
5. Removed session/participant tracking from Zustand store

**Benefits:**
- Simpler codebase with fewer moving parts
- Faster page loads (no WebSocket handshake)
- Clearer user experience for solo feedback collection

## Screenshot Rename Functionality

**Date:** 2026-01-28

**Files:** `src/api/screenshots/[id]/route.ts`, `src/components/ScreenshotThumbnail.tsx`

**Problem:**
Screenshots were auto-named with timestamps and page titles, making it hard to identify specific captures when reviewing multiple screenshots.

**Solution:**
Added rename functionality:
1. Added `PATCH /api/screenshots/[id]` endpoint to update screenshot `pageTitle`
2. Added edit button on `ScreenshotThumbnail` component
3. Inline rename with input field and save/cancel buttons

## Export Button Separation

**Date:** 2026-01-28

**Files:** `src/app/projects/[id]/page.tsx`, `src/lib/export/markdown.ts`, `src/lib/export/pdf.ts`

**Problem:**
Export functionality used a single dropdown button, requiring extra clicks to select format. Users often export to the same format repeatedly.

**Solution:**
Split into two separate buttons:
1. "Export (.md)" button for Markdown export
2. "Export (.pdf)" button for PDF export
3. Each button triggers direct download without intermediate selection

## Screenshot Embedding in Exports

**Date:** 2026-01-28

**Files:** `src/lib/export/markdown.ts`, `src/lib/export/pdf.ts`, `src/lib/export/annotateImage.ts`

**Problem:**
Exported Markdown/PDF files referenced screenshots by filename, requiring users to manually include image files.

**Solution:**
1. Screenshots are now embedded as base64 data URLs in Markdown
2. Screenshots are embedded directly in PDF using `pdf-lib`
3. Annotation markers (numbered circles) are drawn directly on images using `sharp`
4. Exports are now fully self-contained single files
