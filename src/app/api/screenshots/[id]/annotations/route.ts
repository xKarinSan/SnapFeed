import { NextRequest, NextResponse } from "next/server";
import {
  createAnnotation,
  getAnnotationsByScreenshot,
} from "@/lib/db/annotations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const annotations = await getAnnotationsByScreenshot(id);
    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Failed to fetch annotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, posX, posY } = body;

    if (!content || posX === undefined || posY === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const annotation = await createAnnotation({
      screenshotId: id,
      content,
      posX,
      posY,
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Failed to create annotation:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
