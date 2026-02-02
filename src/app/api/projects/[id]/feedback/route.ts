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
    const { content, author } = body;

    if (!content || !author) {
      return NextResponse.json(
        { error: "Content and author are required" },
        { status: 400 }
      );
    }

    const feedbackData: CreateFeedbackInput = {
      projectId,
      content,
      author,
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
