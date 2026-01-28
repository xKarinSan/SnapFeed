import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/projects";
import { getScreenshotsByProject } from "@/lib/db/screenshots";
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

    // Fetch screenshots with annotations
    const screenshots = await getScreenshotsByProject(id);

    // Convert screenshots to export format with base64 data and annotation markers
    const exportScreenshots = await Promise.all(
      screenshots.map(async (screenshot) => {
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

        return {
          pageTitle: screenshot.pageTitle,
          pageUrl: screenshot.pageUrl,
          base64Data,
          annotations: screenshot.annotations.map((a) => ({
            content: a.content,
            author: a.author,
            posX: a.posX,
            posY: a.posY,
          })),
        };
      })
    );

    // Filter out screenshots that couldn't be read
    const validScreenshots = exportScreenshots.filter((s) => s.base64Data);

    const exportData = {
      projectName: project.name,
      url: project.url,
      feedbacks: project.feedbacks.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        type: f.type as "ui" | "non-ui",
      })),
      screenshots: validScreenshots,
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
