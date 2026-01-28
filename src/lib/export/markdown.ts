import { Feedback } from "@/lib/store/useStore";

interface ExportAnnotation {
  content: string;
  author: string;
  posX: number;
  posY: number;
}

interface ExportScreenshot {
  pageTitle: string | null;
  pageUrl: string;
  base64Data: string;
  annotations: ExportAnnotation[];
}

interface ExportData {
  projectName: string;
  url: string;
  feedbacks: Feedback[];
  screenshots: ExportScreenshot[];
}

export function generateMarkdownExport(data: ExportData): string {
  const { projectName, url, feedbacks, screenshots } = data;

  const uiFeedbacks = feedbacks.filter((f) => f.type === "ui");
  const generalFeedbacks = feedbacks.filter((f) => f.type === "non-ui");

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 1) Project Name and metadata
  let markdown = `# Feedback Report: ${projectName}

**URL**: ${url}
**Exported**: ${exportDate}

---

`;

  // 2) General Notes (non-UI feedback)
  if (generalFeedbacks.length > 0) {
    markdown += `## General Notes

`;
    generalFeedbacks.forEach((feedback) => {
      markdown += `- ${escapeMarkdown(feedback.content)}
`;
    });

    markdown += `
---

`;
  }

  // 3) Screenshots with annotations
  if (screenshots.length > 0) {
    markdown += `## Screenshots

`;
    screenshots.forEach((screenshot, index) => {
      const title = screenshot.pageTitle || screenshot.pageUrl;
      markdown += `### Screenshot ${index + 1}: ${escapeMarkdown(title)}

![Screenshot ${index + 1}](${screenshot.base64Data})

`;

      if (screenshot.annotations.length > 0) {
        markdown += `**Notes:**

`;
        screenshot.annotations.forEach((annotation, annotIndex) => {
          markdown += `${annotIndex + 1}. ${escapeMarkdown(annotation.content)}
`;
        });

        markdown += `
`;
      }

      if (index < screenshots.length - 1) {
        markdown += `---

`;
      }
    });
  }

  // 4) UI Feedback (if any)
  if (uiFeedbacks.length > 0) {
    if (screenshots.length > 0 || generalFeedbacks.length > 0) {
      markdown += `---

`;
    }

    markdown += `## UI Feedback

`;
    uiFeedbacks.forEach((feedback, index) => {
      const status = feedback.resolved ? "Resolved" : "Open";
      const statusIcon = feedback.resolved ? " ✓" : "";

      markdown += `### ${index + 1}. "${escapeMarkdown(feedback.content)}" — ${feedback.author}
`;
      if (feedback.posX !== null && feedback.posY !== null) {
        markdown += `- **Position**: (x: ${feedback.posX?.toFixed(1)}%, y: ${feedback.posY?.toFixed(1)}%)
`;
      }
      markdown += `- **Status**: ${status}${statusIcon}

`;
    });
  }

  // Handle empty state
  if (feedbacks.length === 0 && screenshots.length === 0) {
    markdown += `*No feedback or screenshots have been collected for this project yet.*
`;
  }

  return markdown;
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
