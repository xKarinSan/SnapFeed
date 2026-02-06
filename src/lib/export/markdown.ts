interface ExportAnnotation {
  content: string;
  posX: number;
  posY: number;
}

interface ExportScreenshot {
  pageTitle: string | null;
  pageUrl: string;
  base64Data: string;
  annotations: ExportAnnotation[];
}

interface ExportFeedback {
  content: string;
  createdAt: string;
}

export interface ExportData {
  projectName: string;
  url: string | null;
  feedbacks: ExportFeedback[];
  screenshots: ExportScreenshot[];
}

export function generateMarkdownExport(data: ExportData): string {
  const { projectName, url, feedbacks, screenshots } = data;

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

  // 2) General Notes
  if (feedbacks.length > 0) {
    markdown += `## General Notes

`;
    feedbacks.forEach((feedback) => {
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
