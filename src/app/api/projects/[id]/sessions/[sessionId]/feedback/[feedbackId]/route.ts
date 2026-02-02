import { NextRequest, NextResponse } from "next/server";
import { getFeedback, updateFeedback, deleteFeedback } from "@/lib/db/feedback";

type RouteParams = {
  params: Promise<{ id: string; sessionId: string; feedbackId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { feedbackId } = await params;
    const feedback = await getFeedback(feedbackId);

    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { feedbackId } = await params;
    const body = await request.json();
    const { content } = body;

    const feedback = await updateFeedback(feedbackId, { content });
    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Failed to update feedback:", error);
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { feedbackId } = await params;
    await deleteFeedback(feedbackId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feedback:", error);
    return NextResponse.json(
      { error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
