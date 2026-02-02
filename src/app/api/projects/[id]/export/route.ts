import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/projects";
import { getSessionsByProject } from "@/lib/db/sessions";
import { getFeedbacksBySession } from "@/lib/db/feedback";
import { getScreenshotsBySession } from "@/lib/db/screenshots";
import { generateMarkdownExport } from "@/lib/export/markdown";
import { generatePdfExport } from "@/lib/export/pdf";
import { annotateImageWithMarkers } from "@/lib/export/annotateImage";
import * as fs from "fs";
import * as path from "path";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format") || "markdown";
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all sessions for this project
    const sessions = await getSessionsByProject(id);

    // Collect all feedbacks and screenshots across sessions
    const allFeedbacks: Array<{
      content: string;
      createdAt: string;
      sessionTitle: string;
    }> = [];

    const allScreenshots: Array<{
      pageTitle: string | null;
      pageUrl: string;
      base64Data: string;
      annotations: Array<{
        content: string;
        posX: number;
        posY: number;
      }>;
      sessionTitle: string;
    }> = [];

    for (const session of sessions) {
      // Get feedbacks for this session
      const feedbacks = await getFeedbacksBySession(session.id);
      for (const feedback of feedbacks) {
        allFeedbacks.push({
          content: feedback.content,
          createdAt: feedback.createdAt.toISOString(),
          sessionTitle: session.title,
        });
      }

      // Get screenshots for this session
      const screenshots = await getScreenshotsBySession(session.id);
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
          allScreenshots.push({
            pageTitle: screenshot.pageTitle,
            pageUrl: screenshot.pageUrl,
            base64Data,
            annotations: screenshot.annotations.map((a) => ({
              content: a.content,
              posX: a.posX,
              posY: a.posY,
            })),
            sessionTitle: session.title,
          });
        }
      }
    }

    const exportData = {
      projectName: project.name,
      url: project.url,
      feedbacks: allFeedbacks.map((f) => ({
        content: f.content,
        createdAt: f.createdAt,
        type: "non-ui" as const,
      })),
      screenshots: allScreenshots,
    };

    const sanitizedName = project.name.replace(/[^a-zA-Z0-9]/g, "-");

    if (format === "pdf") {
      const pdfBuffer = await generatePdfExport(exportData);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${sanitizedName}-feedback.pdf"`,
        },
      });
    }

    const markdown = generateMarkdownExport(exportData);
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizedName}-feedback.md"`,
      },
    });
  } catch (error) {
    console.error("Failed to export:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
