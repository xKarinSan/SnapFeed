import { NextResponse } from "next/server";
import { listChats, isAuthenticated } from "@/lib/lark/client";

export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Not authenticated with Lark" },
        { status: 401 }
      );
    }

    // Fetch all chats (paginate if needed)
    const allChats: Array<{
      id: string;
      name: string;
      avatar: string;
      type: string;
    }> = [];

    let pageToken: string | undefined;

    do {
      const response = await listChats(pageToken);

      for (const chat of response.data.items || []) {
        allChats.push({
          id: chat.chat_id,
          name: chat.name,
          avatar: chat.avatar,
          type: chat.chat_type, // "group" or "p2p"
        });
      }

      pageToken = response.data.has_more ? response.data.page_token : undefined;
    } while (pageToken);

    return NextResponse.json({ chats: allChats });
  } catch (error) {
    console.error("Failed to list chats:", error);
    return NextResponse.json(
      { error: "Failed to list chats" },
      { status: 500 }
    );
  }
}
