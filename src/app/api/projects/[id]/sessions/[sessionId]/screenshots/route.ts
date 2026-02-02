import { NextRequest, NextResponse } from "next/server";
import { getScreenshotsBySession } from "@/lib/db/screenshots";

type RouteParams = { params: Promise<{ id: string; sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const screenshots = await getScreenshotsBySession(sessionId);
    return NextResponse.json(screenshots);
  } catch (error) {
    console.error("Failed to fetch screenshots:", error);
    return NextResponse.json(
      { error: "Failed to fetch screenshots" },
      { status: 500 }
    );
  }
}
