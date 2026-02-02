import { NextRequest, NextResponse } from "next/server";
import { getFeedbacksBySession, createFeedback } from "@/lib/db/feedback";

type RouteParams = { params: Promise<{ id: string; sessionId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const feedbacks = await getFeedbacksBySession(sessionId);
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
    const { sessionId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const feedback = await createFeedback({ sessionId, content });
    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}
