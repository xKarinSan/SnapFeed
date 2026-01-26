import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db/projects";
import { generateMarkdownExport } from "@/lib/export/markdown";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const markdown = generateMarkdownExport({
      projectName: project.name,
      url: project.url,
      feedbacks: project.feedbacks.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        type: f.type as "ui" | "non-ui",
      })),
    });

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "-")}-feedback.md"`,
      },
    });
  } catch (error) {
    console.error("Failed to export:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
