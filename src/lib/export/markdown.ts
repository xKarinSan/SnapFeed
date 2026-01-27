import { Feedback } from "@/lib/store/useStore";

interface ExportData {
  projectName: string;
  url: string;
  feedbacks: Feedback[];
}

export function generateMarkdownExport(data: ExportData): string {
  const { projectName, url, feedbacks } = data;

  const uiFeedbacks = feedbacks.filter((f) => f.type === "ui");
  const generalFeedbacks = feedbacks.filter((f) => f.type === "non-ui");

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let markdown = `# Feedback Report: ${projectName}

**URL**: ${url}
**Exported**: ${exportDate}
**Total Feedback**: ${feedbacks.length} items (${uiFeedbacks.length} UI, ${generalFeedbacks.length} General)

---

`;

  if (uiFeedbacks.length > 0) {
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

  if (generalFeedbacks.length > 0) {
    if (uiFeedbacks.length > 0) {
      markdown += `---

`;
    }

    markdown += `## General Feedback

`;
    generalFeedbacks.forEach((feedback, index) => {
      const status = feedback.resolved ? "Resolved" : "Open";
      const statusIcon = feedback.resolved ? " ✓" : "";

      markdown += `### ${index + 1}. "${escapeMarkdown(feedback.content)}" — ${feedback.author}
- **Status**: ${status}${statusIcon}

`;
    });
  }

  if (feedbacks.length === 0) {
    markdown += `*No feedback has been collected for this project yet.*
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
