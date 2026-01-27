import { NextRequest, NextResponse } from "next/server";
import { getScreenshotById, deleteScreenshot } from "@/lib/db/screenshots";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const screenshot = await getScreenshotById(params.id);
    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(screenshot);
  } catch (error) {
    console.error("Failed to fetch screenshot:", error);
    return NextResponse.json(
      { error: "Failed to fetch screenshot" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const screenshot = await getScreenshotById(params.id);
    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }

    // Delete the file
    const filepath = path.join(
      process.cwd(),
      "uploads",
      "screenshots",
      screenshot.filename
    );
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    await deleteScreenshot(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete screenshot:", error);
    return NextResponse.json(
      { error: "Failed to delete screenshot" },
      { status: 500 }
    );
  }
}
