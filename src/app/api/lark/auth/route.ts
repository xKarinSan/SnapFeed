import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/config/settings";
import { LARK_BASE_URL } from "@/lib/lark/types";

// GET - Return OAuth authorization URL
export async function GET(request: NextRequest) {
  try {
    const settings = getSettings();

    if (!settings.lark?.appId) {
      return NextResponse.json(
        { error: "Lark App ID not configured" },
        { status: 400 }
      );
    }

    // Build redirect URI from request URL
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/lark/callback`;

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

    const authUrl = `${LARK_BASE_URL}/open-apis/authen/v1/authorize?${params.toString()}`;

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Failed to generate OAuth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate OAuth URL" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect Lark (clear tokens)
export async function DELETE() {
  try {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to disconnect Lark:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Lark" },
      { status: 500 }
    );
  }
}
