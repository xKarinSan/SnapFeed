import { NextRequest, NextResponse } from "next/server";
import {
  createAnnotation,
  getAnnotationsByScreenshot,
} from "@/lib/db/annotations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const annotations = await getAnnotationsByScreenshot(params.id);
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, author, posX, posY } = body;

    if (!content || !author || posX === undefined || posY === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const annotation = await createAnnotation({
      screenshotId: params.id,
      content,
      author,
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
