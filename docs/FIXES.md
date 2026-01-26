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
