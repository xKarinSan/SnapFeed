import { NextRequest, NextResponse } from "next/server";
import {
  getFeedbacksByProject,
  createFeedback,
  CreateFeedbackInput,
} from "@/lib/db/feedback";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const feedbacks = await getFeedbacksByProject(id);
    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { type, content, author, posX, posY, viewportW, viewportH, selector } =
      body;

    if (!type || !content || !author) {
      return NextResponse.json(
        { error: "Type, content, and author are required" },
        { status: 400 }
      );
    }

    if (type === "ui" && (posX === undefined || posY === undefined)) {
      return NextResponse.json(
        { error: "UI feedback requires position coordinates" },
        { status: 400 }
      );
    }

    const feedbackData: CreateFeedbackInput = {
      projectId,
      type,
      content,
      author,
      posX,
      posY,
      viewportW,
      viewportH,
      selector,
    };

    const feedback = await createFeedback(feedbackData);
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}
