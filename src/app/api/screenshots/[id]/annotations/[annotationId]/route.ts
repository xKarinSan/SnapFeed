import { NextRequest, NextResponse } from "next/server";
import {
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
} from "@/lib/db/annotations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; annotationId: string } }
) {
  try {
    const annotation = await getAnnotationById(params.annotationId);
    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Failed to fetch annotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; annotationId: string } }
) {
  try {
    const body = await request.json();
    const { content, posX, posY } = body;

    const annotation = await updateAnnotation(params.annotationId, {
      content,
      posX,
      posY,
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Failed to update annotation:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; annotationId: string } }
) {
  try {
    await deleteAnnotation(params.annotationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete annotation:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
