import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/config/settings";
import { LARK_BASE_URL, LarkOAuthTokenResponse, LarkUserInfoResponse } from "@/lib/lark/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    return new NextResponse(
      generateCallbackHtml(false, error),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  if (!code) {
    return new NextResponse(
      generateCallbackHtml(false, "No authorization code received"),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const settings = getSettings();

    if (!settings.lark?.appId || !settings.lark?.appSecret) {
      return new NextResponse(
        generateCallbackHtml(false, "Lark App credentials not configured"),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // First, get app_access_token
    const appTokenResponse = await fetch(
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

    const appTokenData = await appTokenResponse.json();

    if (appTokenData.code !== 0) {
      console.error("Failed to get app access token:", appTokenData);
      return new NextResponse(
        generateCallbackHtml(false, `Error ${appTokenData.code}: ${appTokenData.msg || "Failed to get app token"}`),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const appAccessToken = appTokenData.app_access_token;

    // Exchange code for user access token
    const tokenResponse = await fetch(
      `${LARK_BASE_URL}/open-apis/authen/v1/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${appAccessToken}`,
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    const tokenData: LarkOAuthTokenResponse = await tokenResponse.json();

    // Log for debugging
    if (tokenData.code !== 0) {
      console.error("Lark token exchange failed:", tokenData);
    }

    if (tokenData.code !== 0) {
      return new NextResponse(
        generateCallbackHtml(false, `Error ${tokenData.code}: ${tokenData.msg || "Failed to exchange code for token"}`),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData.data;
    const expiresAt = Date.now() + expires_in * 1000;

    // Get user info
    const userResponse = await fetch(
      `${LARK_BASE_URL}/open-apis/authen/v1/user_info`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userData: LarkUserInfoResponse = await userResponse.json();

    let userName = "";
    let userAvatar = "";
    let userId = "";

    if (userData.code === 0 && userData.data) {
      userName = userData.data.name || userData.data.en_name || "";
      userAvatar = userData.data.avatar_url || userData.data.avatar_thumb || "";
      userId = userData.data.user_id || userData.data.open_id || "";
    }

    // Save tokens and user info
    updateSettings({
      lark: {
        ...settings.lark,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        userId,
        userName,
        userAvatar,
      },
    });

    return new NextResponse(
      generateCallbackHtml(true),
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new NextResponse(
      generateCallbackHtml(false, "An unexpected error occurred"),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

function generateCallbackHtml(success: boolean, error?: string): string {
  const message = success
    ? { type: "lark-oauth-success" }
    : { type: "lark-oauth-error", error: error || "Unknown error" };

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${success ? "Connected!" : "Connection Failed"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    p {
      margin: 0;
      color: #666;
    }
    .error {
      color: #dc2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? "✓" : "✕"}</div>
    <h1>${success ? "Connected to Lark!" : "Connection Failed"}</h1>
    <p class="${success ? "" : "error"}">${success ? "You can close this window." : error}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage(${JSON.stringify(message)}, '*');
      setTimeout(() => window.close(), 1500);
    }
  </script>
</body>
</html>
  `.trim();
}
