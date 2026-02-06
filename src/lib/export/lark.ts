import { ExportData } from "./markdown";
import {
    createDocument,
    createBlocks,
    updateBlock,
    uploadDocxMedia,
    sendMessage,
    getValidAccessToken,
} from "../lark/client";
import { buildDocumentBlocks } from "../lark/documentBuilder";
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
    options: LarkExportOptions,
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
    console.log("exportToLark | 1. Create the document");
    const docResponse = await createDocument(title, folderToken);
    const documentId = docResponse.data.document.document_id;

    // 2. Upload all screenshots first to get file tokens
    console.log(
        "exportToLark | 2. Upload all screenshots first to get file tokens",
    );

    const fileTokens: (string | null)[] = [];
    for (let i = 0; i < data.screenshots.length; i++) {
        const screenshot = data.screenshots[i];
        try {
            const base64Match = screenshot.base64Data.match(
                /^data:([^;]+);base64,(.+)$/,
            );

            if (base64Match) {
                const mimeType = base64Match[1];
                const base64Content = base64Match[2];
                const buffer = Buffer.from(base64Content, "base64");

                const ext = mimeType.includes("png") ? "png" : "jpg";
                const fileName = `screenshot_${i + 1}.${ext}`;

                const uploadResponse = await uploadDocxMedia(
                    documentId,
                    fileName,
                    buffer,
                    mimeType,
                );

                console.log(
                    `Uploaded screenshot ${i + 1}:`,
                    uploadResponse.data.file_token,
                );
                fileTokens.push(uploadResponse.data.file_token);
            } else {
                console.error(`Invalid base64 format for screenshot ${i + 1}`);
                fileTokens.push(null);
            }
        } catch (error) {
            console.error(`Failed to upload screenshot ${i + 1}:`, error);
            fileTokens.push(null);
        }
    }

    // 3. Build document blocks with empty image blocks
    console.log(
        "exportToLark | 3. Build document blocks with empty image blocks",
    );
    const { blocks, imageIndices } = buildDocumentBlocks(
        data,
        sessionTitle,
        fileTokens,
    );

    // 4. Create all blocks and get their IDs
    console.log("exportToLark | 4. Create all blocks and get their IDs");
    const blockIds = await addBlocksInBatches(documentId, documentId, blocks);
    console.log("blockIds", blockIds);
    console.log("fileTokens", fileTokens);

    // 5. Patch each empty image block with its file token
    console.log("exportToLark | 5. Patch each empty image block with its file token");
    for (const { blockIndex, screenshotIndex } of imageIndices) {
        console.log("blockIndex", blockIndex);
        console.log("screenshotIndex", screenshotIndex);
        const fileToken = fileTokens[screenshotIndex];
        const blockId = blockIds[blockIndex];

        console.log("fileToken", fileToken);
        console.log("blockId", blockId);

        if (fileToken && blockId) {
            try {
                await updateBlock(documentId, blockId, {
                    replace_image: { token: fileToken },
                });
                console.log(
                    `Patched image block ${blockId} with token ${fileToken}`,
                );
            } catch (error) {
                console.error(`Failed to patch image block ${blockId}:`, error);
            }
        }
    }

    // 6. Generate document URL
    console.log("exportToLark |  6. Generate document URL");

    const documentUrl = `${LARK_BASE_URL.replace("open.", "")}/docx/${documentId}`;

    // 7. Share to chats if specified
    console.log("exportToLark | 7. Share to chats if specified");

    const sharedTo: string[] = [];

    if (chatIds && chatIds.length > 0) {
        const messageCard = buildShareMessageCard({
            title: "New Feedback Report",
            projectName: data.projectName,
            sessionTitle,
            url: data.url || "",
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
 * Returns array of created block IDs in the same order as input blocks
 */
async function addBlocksInBatches(
    documentId: string,
    parentBlockId: string,
    blocks: LarkBlock[],
    batchSize = 50,
): Promise<string[]> {
    // shuld return all the ones with images
    const allBlockIds: string[] = [];

    for (let i = 0; i < blocks.length; i += batchSize) {
        const batch = blocks.slice(i, i + batchSize);
        const response = await createBlocks(
            documentId,
            parentBlockId,
            batch,
        );

        console.log("addBlocksInBatches | response", JSON.stringify(response));

        // Extract block IDs from response
        if (response.data?.children) {
            for (const child of response.data.children) {
                if (child.block_type == 27) {
                    allBlockIds.push(child.block_id);
                }
            }
        }
    }

    return allBlockIds;
}
