import { ExportData } from "./markdown";
import {
  createDocument,
  createBlocks,
  uploadMedia,
  sendMessage,
  getValidAccessToken,
} from "../lark/client";
import { buildDocumentBlocks, insertImageBlocks } from "../lark/documentBuilder";
import { buildShareMessageCard } from "../lark/messageBuilder";
import { LarkBlock, LARK_BASE_URL } from "../lark/types";

export interface LarkExportOptions {
  data: ExportData;
  sessionTitle?: string;
  folderToken?: string;
  documentTitle?: string;
  chatIds?: string[];
}

export interface LarkExportResult {
  documentId: string;
  documentUrl: string;
  sharedTo: string[];
}

/**
 * Export feedback data to Lark Doc and optionally share to chats
 */
export async function exportToLark(
  options: LarkExportOptions
): Promise<LarkExportResult> {
  const { data, sessionTitle, folderToken, documentTitle, chatIds } = options;

  // Ensure we have a valid token
  await getValidAccessToken();

  // Build document title
  const title =
    documentTitle ||
    (sessionTitle
      ? `${data.projectName} - ${sessionTitle}`
      : `Feedback Report: ${data.projectName}`);

  // 1. Create the document
  const docResponse = await createDocument(title, folderToken);
  const documentId = docResponse.data.document.document_id;

  // 2. Build document blocks
  const { blocks, imageIndices } = buildDocumentBlocks(data, sessionTitle);

  // 3. Upload images and get file tokens
  const fileTokens: string[] = [];

  for (let i = 0; i < data.screenshots.length; i++) {
    const screenshot = data.screenshots[i];

    try {
      // Extract base64 data and mime type
      const base64Match = screenshot.base64Data.match(
        /^data:([^;]+);base64,(.+)$/
      );

      if (base64Match) {
        const mimeType = base64Match[1];
        const base64Content = base64Match[2];
        const buffer = Buffer.from(base64Content, "base64");

        // Determine file extension
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const fileName = `screenshot_${i + 1}.${ext}`;

        const uploadResponse = await uploadMedia(
          fileName,
          buffer,
          mimeType,
          "docx_image",
          documentId
        );

        fileTokens.push(uploadResponse.data.file_token);
      } else {
        // If not base64, skip this image
        fileTokens.push("");
      }
    } catch (error) {
      console.error(`Failed to upload screenshot ${i + 1}:`, error);
      fileTokens.push("");
    }
  }

  // 4. Replace placeholder blocks with actual image blocks
  const finalBlocks = insertImageBlocks(blocks, imageIndices, fileTokens);

  // 5. Add blocks to document (skip the page block, start from first child)
  // Lark docs have a root "page" block, we need to add children to it
  // The document_id is also the root block_id for the page
  await addBlocksInBatches(documentId, documentId, finalBlocks);

  // 6. Generate document URL
  const documentUrl = `${LARK_BASE_URL.replace("open.", "")}/docx/${documentId}`;

  // 7. Share to chats if specified
  const sharedTo: string[] = [];

  if (chatIds && chatIds.length > 0) {
    const messageCard = buildShareMessageCard({
      title: "New Feedback Report",
      projectName: data.projectName,
      sessionTitle,
      url: data.url,
      documentUrl,
      feedbackCount: data.feedbacks.length,
      screenshotCount: data.screenshots.length,
    });

    for (const chatId of chatIds) {
      try {
        await sendMessage(chatId, messageCard);
        sharedTo.push(chatId);
      } catch (error) {
        console.error(`Failed to share to chat ${chatId}:`, error);
      }
    }
  }

  return {
    documentId,
    documentUrl,
    sharedTo,
  };
}

/**
 * Add blocks in batches to avoid API limits
 * Lark has a limit of 50 blocks per request
 */
async function addBlocksInBatches(
  documentId: string,
  parentBlockId: string,
  blocks: LarkBlock[],
  batchSize = 50
): Promise<void> {
  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    await createBlocks(documentId, parentBlockId, batch, i);
  }
}
