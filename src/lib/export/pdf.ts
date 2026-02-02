import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ExportData } from "./markdown";

export async function generatePdfExport(data: ExportData): Promise<Buffer> {
  const { projectName, url, feedbacks, screenshots } = data;

  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawText = (
    text: string,
    options: {
      font?: typeof helvetica;
      size?: number;
      color?: { r: number; g: number; b: number };
      indent?: number;
      maxWidth?: number;
    } = {}
  ) => {
    const font = options.font || helvetica;
    const size = options.size || 11;
    const color = options.color || { r: 0, g: 0, b: 0 };
    const indent = options.indent || 0;
    const maxWidth = options.maxWidth || contentWidth - indent;

    // Simple word wrapping
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    for (const ln of lines) {
      if (y < margin + 20) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      page.drawText(ln, {
        x: margin + indent,
        y,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
      });
      y -= size + 4;
    }
  };

  const drawHorizontalRule = () => {
    y -= 10;
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 15;
  };

  const addSpace = (amount: number) => {
    y -= amount;
    if (y < margin + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  // 1) Title and metadata
  drawText(`Feedback Report: ${projectName}`, {
    font: helveticaBold,
    size: 20,
  });
  addSpace(10);
  drawText(`URL: ${url}`, { size: 10, color: { r: 0.4, g: 0.4, b: 0.4 } });
  drawText(`Exported: ${exportDate}`, {
    size: 10,
    color: { r: 0.4, g: 0.4, b: 0.4 },
  });

  drawHorizontalRule();

  // 2) General Notes
  if (feedbacks.length > 0) {
    drawText("General Notes", { font: helveticaBold, size: 16 });
    addSpace(8);

    for (const feedback of feedbacks) {
      drawText(`• ${feedback.content}`, { indent: 10 });
      addSpace(4);
    }

    drawHorizontalRule();
  }

  // 3) Screenshots with annotations
  if (screenshots.length > 0) {
    drawText("Screenshots", { font: helveticaBold, size: 16 });
    addSpace(8);

    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const title = screenshot.pageTitle || screenshot.pageUrl;

      drawText(`Screenshot ${i + 1}: ${title}`, {
        font: helveticaBold,
        size: 12,
      });
      addSpace(8);

      // Embed screenshot image
      if (screenshot.base64Data) {
        try {
          const base64Match = screenshot.base64Data.match(
            /^data:image\/(png|jpeg|jpg);base64,(.+)$/
          );
          if (base64Match) {
            const imageBytes = Buffer.from(base64Match[2], "base64");
            const imageType = base64Match[1];

            let image;
            if (imageType === "png") {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }

            // Scale image to fit page width
            const scale = Math.min(contentWidth / image.width, 250 / image.height);
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;

            // Check if we need a new page for the image
            if (y - scaledHeight < margin) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }

            page.drawImage(image, {
              x: margin,
              y: y - scaledHeight,
              width: scaledWidth,
              height: scaledHeight,
            });
            y -= scaledHeight + 10;
          }
        } catch (err) {
          console.warn(`Failed to embed screenshot ${i + 1}:`, err);
        }
      }

      // Notes (annotations)
      if (screenshot.annotations.length > 0) {
        addSpace(5);
        drawText("Notes:", { font: helveticaBold, size: 11 });
        addSpace(4);

        for (let j = 0; j < screenshot.annotations.length; j++) {
          const annotation = screenshot.annotations[j];
          drawText(`${j + 1}. ${annotation.content}`, { indent: 10 });
          addSpace(2);
        }
      }

      if (i < screenshots.length - 1) {
        drawHorizontalRule();
      }
    }
  }

  // Handle empty state
  if (feedbacks.length === 0 && screenshots.length === 0) {
    drawText("No feedback or screenshots have been collected for this project yet.", {
      color: { r: 0.4, g: 0.4, b: 0.4 },
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
