import { LarkMessageCard } from "./types";

interface MessageCardOptions {
  title: string;
  projectName: string;
  sessionTitle?: string;
  url: string;
  documentUrl: string;
  feedbackCount: number;
  screenshotCount: number;
}

/**
 * Build a message card for sharing the exported document
 */
export function buildShareMessageCard(options: MessageCardOptions): LarkMessageCard {
  const {
    title,
    projectName,
    sessionTitle,
    url,
    documentUrl,
    feedbackCount,
    screenshotCount,
  } = options;

  const subtitle = sessionTitle
    ? `${projectName} - ${sessionTitle}`
    : projectName;

  const stats: string[] = [];
  if (feedbackCount > 0) {
    stats.push(`${feedbackCount} feedback item${feedbackCount > 1 ? "s" : ""}`);
  }
  if (screenshotCount > 0) {
    stats.push(`${screenshotCount} screenshot${screenshotCount > 1 ? "s" : ""}`);
  }

  const statsText = stats.length > 0 ? stats.join(", ") : "No items";

  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: "plain_text",
        content: title,
      },
      template: "blue",
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**Project:** ${subtitle}`,
        },
      },
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**URL:** ${url}`,
        },
      },
      {
        tag: "div",
        text: {
          tag: "plain_text",
          content: `Contains: ${statsText}`,
        },
      },
      {
        tag: "hr",
      },
      {
        tag: "action",
        actions: [
          {
            tag: "button",
            text: {
              tag: "plain_text",
              content: "View Document",
            },
            type: "primary",
            url: documentUrl,
          },
        ],
      },
    ],
  };
}
