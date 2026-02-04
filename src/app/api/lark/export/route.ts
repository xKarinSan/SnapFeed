import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/projects";
import { getSession } from "@/lib/db/sessions";
import { getFeedbacksBySession } from "@/lib/db/feedback";
import { getScreenshotsBySession } from "@/lib/db/screenshots";
import { annotateImageWithMarkers } from "@/lib/export/annotateImage";
import { exportToLark } from "@/lib/export/lark";
import { isAuthenticated } from "@/lib/lark/client";
import * as fs from "fs";
import * as path from "path";

interface ExportRequest {
  projectId: string;
  sessionId: string;
  folderToken?: string;
  title?: string;
  chatIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Not authenticated with Lark" },
        { status: 401 }
      );
    }

    const body: ExportRequest = await request.json();
    const { projectId, sessionId, folderToken, title, chatIds } = body;

    if (!projectId || !sessionId) {
      return NextResponse.json(
        { error: "Project ID and Session ID are required" },
        { status: 400 }
      );
    }

    // Fetch project
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Fetch session
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch feedbacks
    const feedbacks = await getFeedbacksBySession(sessionId);

    // Fetch screenshots with annotations
    const screenshots = await getScreenshotsBySession(sessionId);

    // Process screenshots to include base64 data with annotation markers
    const processedScreenshots: Array<{
      pageTitle: string | null;
      pageUrl: string;
      base64Data: string;
      annotations: Array<{
        content: string;
        posX: number;
        posY: number;
      }>;
    }> = [];

    for (const screenshot of screenshots) {
      let base64Data = "";

      try {
        const filepath = path.join(
          process.cwd(),
          "uploads",
          "screenshots",
          screenshot.filename
        );

        if (fs.existsSync(filepath)) {
          const fileBuffer = fs.readFileSync(filepath);
          const ext = path.extname(screenshot.filename).toLowerCase();
          const mimeType =
            ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

          // Create markers for each annotation (1-indexed)
          const markers = screenshot.annotations.map((a, index) => ({
            posX: a.posX,
            posY: a.posY,
            number: index + 1,
          }));

          // Draw annotation markers on the image
          base64Data = await annotateImageWithMarkers(
            fileBuffer,
            markers,
            mimeType as "image/png" | "image/jpeg"
          );
        }
      } catch (err) {
        console.warn(`Failed to read screenshot ${screenshot.filename}:`, err);
      }

      if (base64Data) {
        processedScreenshots.push({
          pageTitle: screenshot.pageTitle,
          pageUrl: screenshot.pageUrl,
          base64Data,
          annotations: screenshot.annotations.map((a) => ({
            content: a.content,
            posX: a.posX,
            posY: a.posY,
          })),
        });
      }
    }

    // Build export data
    const exportData = {
      projectName: project.name,
      url: project.url,
      feedbacks: feedbacks.map((f) => ({
        content: f.content,
        createdAt: f.createdAt.toISOString(),
      })),
      screenshots: processedScreenshots,
    };

    // Export to Lark
    const result = await exportToLark({
      data: exportData,
      sessionTitle: session.title,
      folderToken,
      documentTitle: title,
      chatIds,
    });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      documentUrl: result.documentUrl,
      sharedTo: result.sharedTo,
    });
  } catch (error) {
    console.error("Failed to export to Lark:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export to Lark" },
      { status: 500 }
    );
  }
}
