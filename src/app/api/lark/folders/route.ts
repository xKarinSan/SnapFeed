import { NextResponse } from "next/server";
import { listFolders, getRootFolder, isAuthenticated } from "@/lib/lark/client";

export async function GET() {
  try {
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: "Not authenticated with Lark" },
        { status: 401 }
      );
    }

    // Get root folder
    const rootResponse = await getRootFolder();
    const rootToken = rootResponse.data.token;

    // List folders in root
    const foldersResponse = await listFolders(rootToken);

    // Filter to only folders (not files)
    const folders = foldersResponse.data.files
      .filter((item) => item.type === "folder")
      .map((folder) => ({
        token: folder.token,
        name: folder.name,
      }));

    return NextResponse.json({
      rootToken,
      folders,
    });
  } catch (error) {
    console.error("Failed to list folders:", error);
    return NextResponse.json(
      { error: "Failed to list folders" },
      { status: 500 }
    );
  }
}
