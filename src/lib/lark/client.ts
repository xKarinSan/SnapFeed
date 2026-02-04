import { getSettings, updateSettings } from "../config/settings";
import {
  LARK_BASE_URL,
  LarkError,
  LarkOAuthTokenResponse,
  LarkUserInfoResponse,
  LarkCreateDocumentResponse,
  LarkCreateBlockResponse,
  LarkUploadMediaResponse,
  LarkListFoldersResponse,
  LarkRootFolderResponse,
  LarkListChatsResponse,
  LarkSendMessageResponse,
  LarkBlock,
  LarkMessageCard,
} from "./types";

// Token refresh buffer (refresh 5 minutes before expiry)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Get OAuth authorization URL for user to login
 */
export function getOAuthUrl(redirectUri: string): string {
  const settings = getSettings();
  if (!settings.lark?.appId) {
    throw new LarkError(400, "Lark App ID not configured");
  }

  // Request scopes for document creation and drive access
  const scopes = [
    "docx:document",
    "docx:document:create",
    "drive:drive",
    "drive:file",
    "im:message",
    "im:chat",
  ].join(" ");

  const params = new URLSearchParams({
    app_id: settings.lark.appId,
    redirect_uri: redirectUri,
    state: crypto.randomUUID(),
    scope: scopes,
  });

  return `${LARK_BASE_URL}/open-apis/authen/v1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const settings = getSettings();
  if (!settings.lark?.appId || !settings.lark?.appSecret) {
    throw new LarkError(400, "Lark App ID and Secret not configured");
  }

  const response = await fetch(
    `${LARK_BASE_URL}/open-apis/authen/v1/oidc/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: settings.lark.appId,
        client_secret: settings.lark.appSecret,
        code,
      }),
    }
  );

  const data: LarkOAuthTokenResponse = await response.json();

  if (data.code !== 0) {
    throw new LarkError(data.code, data.msg || "Failed to exchange code for token");
  }

  const expiresAt = Date.now() + data.data.expires_in * 1000;

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresAt,
  };
}

/**
 * Get app access token (needed for user token operations)
 */
async function getAppAccessToken(): Promise<string> {
  const settings = getSettings();
  if (!settings.lark?.appId || !settings.lark?.appSecret) {
    throw new LarkError(400, "Lark App ID and Secret not configured");
  }

  const response = await fetch(
    `${LARK_BASE_URL}/open-apis/auth/v3/app_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: settings.lark.appId,
        app_secret: settings.lark.appSecret,
      }),
    }
  );

  const data = await response.json();

  if (data.code !== 0) {
    throw new LarkError(data.code, data.msg || "Failed to get app access token");
  }

  return data.app_access_token;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}> {
  const settings = getSettings();
  if (!settings.lark?.appId || !settings.lark?.appSecret) {
    throw new LarkError(400, "Lark App ID and Secret not configured");
  }
  if (!settings.lark?.refreshToken) {
    throw new LarkError(401, "No refresh token available");
  }

  // Get app access token first
  const appAccessToken = await getAppAccessToken();

  const response = await fetch(
    `${LARK_BASE_URL}/open-apis/authen/v1/refresh_access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${appAccessToken}`,
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: settings.lark.refreshToken,
      }),
    }
  );

  const data: LarkOAuthTokenResponse = await response.json();

  if (data.code !== 0) {
    throw new LarkError(data.code, data.msg || "Failed to refresh token");
  }

  const expiresAt = Date.now() + data.data.expires_in * 1000;

  // Update stored tokens
  updateSettings({
    lark: {
      ...settings.lark,
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      tokenExpiresAt: expiresAt,
    },
  });

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresAt,
  };
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getValidAccessToken(): Promise<string> {
  const settings = getSettings();

  if (!settings.lark?.accessToken) {
    throw new LarkError(401, "Not authenticated with Lark");
  }

  // Check if token needs refresh
  const expiresAt = settings.lark.tokenExpiresAt || 0;
  if (Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt) {
    const { accessToken } = await refreshAccessToken();
    return accessToken;
  }

  return settings.lark.accessToken;
}

/**
 * Make authenticated request to Lark API
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getValidAccessToken();

  const response = await fetch(`${LARK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new LarkError(data.code, data.msg || "Lark API error");
  }

  return data;
}

/**
 * Get authenticated user info
 */
export async function getUserInfo(): Promise<LarkUserInfoResponse> {
  return makeRequest<LarkUserInfoResponse>("/open-apis/authen/v1/user_info");
}

/**
 * Create a new document
 */
export async function createDocument(
  title: string,
  folderToken?: string
): Promise<LarkCreateDocumentResponse> {
  return makeRequest<LarkCreateDocumentResponse>("/open-apis/docx/v1/documents", {
    method: "POST",
    body: JSON.stringify({
      title,
      folder_token: folderToken,
    }),
  });
}

/**
 * Add blocks to a document
 */
export async function createBlocks(
  documentId: string,
  parentBlockId: string,
  blocks: LarkBlock[],
  index?: number
): Promise<LarkCreateBlockResponse> {
  return makeRequest<LarkCreateBlockResponse>(
    `/open-apis/docx/v1/documents/${documentId}/blocks/${parentBlockId}/children`,
    {
      method: "POST",
      body: JSON.stringify({
        children: blocks,
        index,
      }),
    }
  );
}

/**
 * Upload media file (for images)
 */
export async function uploadMedia(
  fileName: string,
  fileData: Uint8Array,
  mimeType: string,
  parentType: "docx_image" | "doc_image" = "docx_image",
  parentNode?: string
): Promise<LarkUploadMediaResponse> {
  const accessToken = await getValidAccessToken();

  const formData = new FormData();
  formData.append("file_name", fileName);
  formData.append("parent_type", parentType);
  if (parentNode) {
    formData.append("parent_node", parentNode);
  }
  formData.append("size", fileData.byteLength.toString());
  const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer;
  formData.append("file", new Blob([arrayBuffer], { type: mimeType }), fileName);

  const response = await fetch(
    `${LARK_BASE_URL}/open-apis/drive/v1/medias/upload_all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const data: LarkUploadMediaResponse = await response.json();

  if (data.code !== 0) {
    throw new LarkError(data.code, data.msg || "Failed to upload media");
  }

  return data;
}

/**
 * Get root folder token
 */
export async function getRootFolder(): Promise<LarkRootFolderResponse> {
  return makeRequest<LarkRootFolderResponse>(
    "/open-apis/drive/explorer/v2/root_folder/meta"
  );
}

/**
 * List files/folders in a folder
 */
export async function listFolders(
  folderToken?: string,
  pageToken?: string
): Promise<LarkListFoldersResponse> {
  const params = new URLSearchParams({
    folder_token: folderToken || "",
    page_size: "50",
  });
  if (pageToken) {
    params.set("page_token", pageToken);
  }

  return makeRequest<LarkListFoldersResponse>(
    `/open-apis/drive/v1/files?${params.toString()}`
  );
}

/**
 * List user's chats
 */
export async function listChats(
  pageToken?: string
): Promise<LarkListChatsResponse> {
  const params = new URLSearchParams({
    page_size: "50",
  });
  if (pageToken) {
    params.set("page_token", pageToken);
  }

  return makeRequest<LarkListChatsResponse>(
    `/open-apis/im/v1/chats?${params.toString()}`
  );
}

/**
 * Send message card to a chat
 */
export async function sendMessage(
  chatId: string,
  card: LarkMessageCard
): Promise<LarkSendMessageResponse> {
  return makeRequest<LarkSendMessageResponse>(
    `/open-apis/im/v1/messages?receive_id_type=chat_id`,
    {
      method: "POST",
      body: JSON.stringify({
        receive_id: chatId,
        msg_type: "interactive",
        content: JSON.stringify(card),
      }),
    }
  );
}

/**
 * Check if user is authenticated with Lark
 */
export function isAuthenticated(): boolean {
  const settings = getSettings();
  return !!(settings.lark?.accessToken && settings.lark?.refreshToken);
}

/**
 * Clear authentication (disconnect)
 */
export function disconnect(): void {
  const settings = getSettings();
  if (settings.lark) {
    updateSettings({
      lark: {
        appId: settings.lark.appId,
        appSecret: settings.lark.appSecret,
        // Clear all auth-related fields
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiresAt: undefined,
        userId: undefined,
        userName: undefined,
        userAvatar: undefined,
      },
    });
  }
}
