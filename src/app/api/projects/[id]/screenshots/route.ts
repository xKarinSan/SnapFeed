import { NextRequest, NextResponse } from "next/server";
import { createScreenshot } from "@/lib/db/screenshots";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "screenshots");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Validate params exist
    const body = await request.json();
    const { dataUrl, pageUrl, sessionId } = body;

    if (!dataUrl) {
      return NextResponse.json(
        { error: "dataUrl is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Invalid data URL format" },
        { status: 400 }
      );
    }

    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique filename
    const filename = `${uuidv4()}.${extension}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Save file
    fs.writeFileSync(filepath, buffer);

    // Save to database
    const screenshot = await createScreenshot({
      sessionId,
      filename,
      pageUrl: pageUrl || "",
      pageTitle: undefined,
    });

    return NextResponse.json({
      id: screenshot.id,
      filename: screenshot.filename,
      pageUrl: screenshot.pageUrl,
      pageTitle: screenshot.pageTitle,
      createdAt: screenshot.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Failed to save screenshot:", error);
    return NextResponse.json(
      { error: "Failed to save screenshot" },
      { status: 500 }
    );
  }
}
