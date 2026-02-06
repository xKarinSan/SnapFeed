import { ExportData } from "../export/markdown";
import { LarkBlock, BLOCK_TYPE, LarkTextElement } from "./types";

/**
 * Create a text element
 */
function textElement(
    content: string,
    bold = false,
    link?: string,
): LarkTextElement {
    const element: LarkTextElement = {
        text_run: {
            content,
            text_element_style: {},
        },
    };

    if (bold && element.text_run?.text_element_style) {
        element.text_run.text_element_style.bold = true;
    }

    if (link && element.text_run?.text_element_style) {
        element.text_run.text_element_style.link = { url: link };
    }

    return element;
}

/**
 * Create a heading block
 */
function heading1Block(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.HEADING1,
        heading1: {
            elements: [textElement(text)],
        },
    };
}

function heading2Block(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.HEADING2,
        heading2: {
            elements: [textElement(text)],
        },
    };
}

function heading3Block(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.HEADING3,
        heading3: {
            elements: [textElement(text)],
        },
    };
}

/**
 * Create a text/paragraph block
 */
function textBlock(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.TEXT,
        text: {
            elements: [textElement(text)],
        },
    };
}

/**
 * Create a bullet list item block
 */
function bulletBlock(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.BULLET,
        bullet: {
            elements: [textElement(text)],
        },
    };
}

/**
 * Create an ordered list item block
 */
function orderedBlock(text: string): LarkBlock {
    return {
        block_type: BLOCK_TYPE.ORDERED,
        ordered: {
            elements: [textElement(text)],
        },
    };
}

/**
 * Create a divider block
 */
function dividerBlock(): LarkBlock {
    return {
        block_type: BLOCK_TYPE.DIVIDER,
        divider: {},
    };
}

/**
 * Create an image block
 * Note: width and height are required by Lark API for block creation
 */
function imageBlock(fileToken: string, width = 800, height = 600): LarkBlock {
    return {
        block_type: BLOCK_TYPE.IMAGE,
        image: {
            file_token: fileToken,
            // width,
            // height,
        },
    };
}

export interface DocumentBuilderResult {
    blocks: LarkBlock[];
    imageIndices: { blockIndex: number; screenshotIndex: number }[];
}

/**
 * Build Lark document blocks from ExportData
 * @param fileTokens - Array of uploaded file tokens (null for failed uploads)
 */
export function buildDocumentBlocks(
    data: ExportData,
    sessionTitle?: string,
    fileTokens?: (string | null)[],
): DocumentBuilderResult {
    const blocks: LarkBlock[] = [];
    const imageIndices: { blockIndex: number; screenshotIndex: number }[] = [];

    // Title
    const title = sessionTitle
        ? `Feedback Report: ${data.projectName} - ${sessionTitle}`
        : `Feedback Report: ${data.projectName}`;
    blocks.push(heading1Block(title));

    // Metadata
    blocks.push(textBlock(`URL: ${data.url}`));

    const exportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    blocks.push(textBlock(`Exported: ${exportDate}`));

    blocks.push(dividerBlock());

    // General Notes (Feedbacks)
    if (data.feedbacks.length > 0) {
        blocks.push(heading2Block("General Notes"));

        for (const feedback of data.feedbacks) {
            blocks.push(bulletBlock(feedback.content));
        }

        blocks.push(dividerBlock());
    }

    // Screenshots
    let imgBlkIdx = 0;
    if (data.screenshots.length > 0) {
        blocks.push(heading2Block("Screenshots"));

        data.screenshots.forEach((screenshot, index) => {
            const screenshotTitle = screenshot.pageTitle || screenshot.pageUrl;
            blocks.push(
                heading3Block(`Screenshot ${index + 1}: ${screenshotTitle}`),
            );
            console.log("fileTokens:", JSON.stringify(fileTokens));
            // Add image block if we have a valid file token
            const fileToken = fileTokens?.[index];
            console.log("fileToken:", fileToken);
            if (fileToken) {
                imageIndices.push({
                    blockIndex: imgBlkIdx,
                    screenshotIndex: index,
                });
                imgBlkIdx++;
                blocks.push(imageBlock(fileToken));
            } else {
                blocks.push(textBlock("[Image upload failed]"));
            }

            // Annotations
            if (screenshot.annotations.length > 0) {
                blocks.push(textBlock("Notes:"));

                for (const annotation of screenshot.annotations) {
                    blocks.push(orderedBlock(annotation.content));
                }
            }

            // Add divider between screenshots (except last)
            if (index < data.screenshots.length - 1) {
                blocks.push(dividerBlock());
            }
        });
    }

    // Empty state
    if (data.feedbacks.length === 0 && data.screenshots.length === 0) {
        blocks.push(
            textBlock(
                "No feedback or screenshots have been collected for this session yet.",
            ),
        );
    }

    return { blocks, imageIndices };
}

/**
 * Replace placeholder blocks with actual image blocks
 */
export function insertImageBlocks(
    blocks: LarkBlock[],
    imageIndices: { blockIndex: number; screenshotIndex: number }[],
    fileTokens: string[],
): LarkBlock[] {
    const result = [...blocks];

    for (const { blockIndex, screenshotIndex } of imageIndices) {
        if (fileTokens[screenshotIndex]) {
            result[blockIndex] = imageBlock(fileTokens[screenshotIndex]);
        }
    }

    return result;
}
