# Lark Integration Plan for SnapFeed

## Overview

Add Lark document export functionality to SnapFeed, allowing users to export feedback sessions directly to Lark Docs. The implementation extends the existing export system and settings infrastructure.

**Scope**: Session-level export to Lark (International/Larksuite) with optional sharing to groups/chats

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Lark API | User OAuth (User Access Token) | User signs in with Lark, can access their own chats |
| HTTP Client | Native fetch | No additional dependencies needed |
| Image Upload | Lark Media API | Required for embedding screenshots in docs |

## Features

### 1. Lark Settings & Authentication
- App ID and App Secret input fields in Settings (for OAuth app)
- "Connect Lark Account" button to initiate OAuth flow
- User signs in with their Lark account
- Access token + refresh token stored securely
- Shows connected user info when authenticated

### 2. Export to Lark
- "Export to Lark" button on session page
- Modal to select destination folder and document title
- Progress indicator during export
- Success state with link to created document

### 3. Share to Groups/Chats
- Multi-select dropdown to choose groups or chats
- Sends document link as a message card to selected recipients
- Optional: skip sharing and just create the document

## Data Flow

```
Session Page → LarkExportModal → /api/lark/export
                                      ↓
                               Lark API Client
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
            Get Token          Upload Images      Create Doc
                                      ↓                 ↓
                              Get file tokens    Add content blocks
                                      └─────────────────┘
                                              ↓
                                       Get doc URL
                                              ↓
                              ┌───────────────┴───────────────┐
                              ↓                               ↓
                    (if groups selected)              Return doc URL
                              ↓
                    Send message card to
                    selected groups/chats
                              ↓
                       Return doc URL
```

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `src/lib/lark/client.ts` | Lark API client with OAuth token management |
| `src/lib/lark/types.ts` | TypeScript interfaces for Lark API |
| `src/lib/lark/auth.ts` | OAuth flow helpers (get auth URL, exchange code) |
| `src/lib/lark/documentBuilder.ts` | Convert ExportData to Lark blocks |
| `src/lib/lark/messageBuilder.ts` | Build message card for sharing |
| `src/lib/export/lark.ts` | Lark export orchestrator |
| `src/components/LarkExportModal.tsx` | Export dialog with folder and chat selection |
| `src/app/api/lark/auth/route.ts` | GET: returns OAuth URL, POST: exchange code for token |
| `src/app/api/lark/callback/route.ts` | OAuth callback handler |
| `src/app/api/lark/folders/route.ts` | GET endpoint for folder list |
| `src/app/api/lark/chats/route.ts` | GET endpoint for user's chats |
| `src/app/api/lark/export/route.ts` | POST endpoint for export and share |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/config/settings.ts` | Add `LarkSettings` interface |
| `src/components/SettingsModal.tsx` | Add Lark credentials section |
| `src/app/projects/[id]/sessions/[sessionId]/page.tsx` | Add "Export to Lark" button |

## Implementation Steps

### Phase 1: Foundation

1. **Create Lark types** (`src/lib/lark/types.ts`)
   - Token response interfaces
   - Document block types (heading, paragraph, image, list, divider)
   - Folder/file metadata types
   - Chat/group metadata types
   - Message card types
   - API error types

2. **Implement Lark client** (`src/lib/lark/client.ts`)
   - `getUserAccessToken()` - get valid token, auto-refresh if expired
   - `refreshAccessToken()` - refresh token when expired
   - `makeRequest()` - authenticated API calls with error handling
   - `listChats()` - fetch user's groups/chats
   - `sendMessage()` - send message card to a chat
   - Base URL: `https://open.larksuite.com`

3. **Extend settings** (`src/lib/config/settings.ts`)
   ```typescript
   interface LarkSettings {
     appId: string;
     appSecret: string;
     // OAuth tokens (stored after user connects)
     accessToken?: string;
     refreshToken?: string;
     tokenExpiresAt?: number;
     // User info
     userId?: string;
     userName?: string;
   }
   ```

### Phase 2: Settings UI & OAuth

4. **Add Lark settings section** to `src/components/SettingsModal.tsx`
   - App ID input (text)
   - App Secret input (masked with toggle)
   - "Connect Lark Account" button (initiates OAuth)
   - When connected: shows user name + "Disconnect" button

5. **Create OAuth callback page** (`src/app/lark/callback/page.tsx`)
   - Handles OAuth redirect from Lark
   - Exchanges auth code for tokens
   - Stores tokens in settings
   - Redirects back to app with success/error state

### Phase 3: Export Logic

6. **Create document builder** (`src/lib/lark/documentBuilder.ts`)
   - Convert `ExportData` to Lark block array
   - Mapping:
     - Project/session title → `heading1`
     - URL, date → `paragraph`
     - Feedbacks → `bullet` list
     - Screenshot title → `heading3`
     - Screenshot image → `image` block (with file token)
     - Annotations → `ordered` list

7. **Create message builder** (`src/lib/lark/messageBuilder.ts`)
   - Build interactive message card with:
     - Document title and preview
     - Direct link to the Lark doc
     - Project/session metadata

8. **Create Lark export function** (`src/lib/export/lark.ts`)
   - Reuse `ExportData` interface from `markdown.ts`
   - Upload images via Media API, get file tokens
   - Create document
   - Add blocks to document
   - Optionally send message to selected chats
   - Return document URL

### Phase 4: API Endpoints

9. **Create auth endpoint** (`src/app/api/lark/auth/route.ts`)
   - GET: returns OAuth authorization URL
   - POST: exchange auth code for access/refresh tokens

10. **Create folders endpoint** (`src/app/api/lark/folders/route.ts`)
    - GET request (requires authenticated user)
    - Fetch user's root folder and subfolders
    - Return folder list with tokens and names

11. **Create chats endpoint** (`src/app/api/lark/chats/route.ts`)
    - GET request (requires authenticated user)
    - Fetch user's groups and chats
    - Return chat list with IDs, names, and avatars

12. **Create export endpoint** (`src/app/api/lark/export/route.ts`)
    - POST request with `{ sessionId, projectId, folderToken, title, chatIds? }`
    - Validate user is authenticated with Lark
    - Fetch session data
    - Call export function (creates doc under user's identity)
    - If `chatIds` provided, send message card to each chat
    - Return `{ documentUrl, sharedTo: string[] }`

### Phase 5: UI Integration

13. **Create LarkExportModal** (`src/components/LarkExportModal.tsx`)
    - Check if user is connected to Lark; if not, show "Connect" prompt
    - Folder dropdown (fetched from API)
    - Document title input (default: session title)
    - Multi-select for groups/chats (user's own chats)
    - "Share to selected chats" toggle (optional)
    - Export button with loading state
    - Success state with document link and share confirmation
    - Error handling with retry

14. **Add export button** to session page
    - Conditionally render when Lark app credentials are configured
    - Position near existing export buttons
    - Lark-styled icon

## Lark APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| OAuth Authorize | `GET /open-apis/authen/v1/authorize` | Redirect user to Lark login |
| Get User Token | `POST /open-apis/authen/v1/oidc/access_token` | Exchange code for tokens |
| Refresh Token | `POST /open-apis/authen/v1/oidc/refresh_access_token` | Refresh expired token |
| Get User Info | `GET /open-apis/authen/v1/user_info` | Get authenticated user details |
| Create Document | `POST /open-apis/docx/v1/documents` | Create empty doc |
| Create Block | `POST /open-apis/docx/v1/documents/:id/blocks/:block_id/children` | Add content |
| Upload Media | `POST /open-apis/drive/v1/medias/upload_all` | Upload screenshots |
| List Folders | `GET /open-apis/drive/v1/files` | Get user's folder list |
| List Chats | `GET /open-apis/im/v1/chats` | Get user's groups/chats |
| Send Message | `POST /open-apis/im/v1/messages` | Send message card to chat |

## Content Block Mapping

| SnapFeed Content | Lark Block Type |
|-----------------|-----------------|
| Session title | `heading1` |
| URL, date | `paragraph` |
| "General Notes" | `heading2` |
| Feedback items | `bullet` |
| "Screenshots" | `heading2` |
| Screenshot title | `heading3` |
| Screenshot image | `image` |
| Annotation list | `ordered` |
| Section divider | `divider` |

## Security Considerations

- **Server-side only**: All Lark API calls in API routes, never client-side
- **Masked secrets**: App Secret uses password input type in UI
- **Token storage**: OAuth tokens stored in `config/settings.json` (single-user app)
- **Token refresh**: Auto-refresh access token before expiry using refresh token
- **Gitignore**: Ensure `config/settings.json` is not committed (contains secrets)

## Verification

1. **Settings & OAuth**
   - Open Settings modal
   - Enter Lark App ID and App Secret, save
   - Click "Connect Lark Account"
   - Redirected to Lark login, authorize the app
   - Redirected back, see connected user name
   - Verify "Disconnect" button works

2. **Export**
   - Navigate to a session with feedback and screenshots
   - Click "Export to Lark"
   - If not connected, prompted to connect first
   - Select a folder from dropdown
   - Click Export
   - Verify document created in Lark under user's account
   - Verify images are embedded correctly
   - Verify annotations are numbered correctly

3. **Share to Chats**
   - In export modal, verify user's groups/chats list loads
   - Select one or more groups/chats
   - Export and verify message card appears in selected chats
   - Verify message card contains correct title and link
   - Test with no chats selected (export only, no sharing)

4. **Edge Cases**
   - Export empty session (no feedback/screenshots)
   - Export session with only feedback (no screenshots)
   - Export with large images
   - Token expired - auto-refresh should work
   - User revoked access - prompt to reconnect
   - User not in any chats (empty chat list)
