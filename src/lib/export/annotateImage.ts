import sharp from "sharp";

interface AnnotationMarker {
  posX: number; // percentage (0-100)
  posY: number; // percentage (0-100)
  number: number;
}

/**
 * Draws numbered circular markers on an image at the specified positions.
 * Returns the modified image as a base64 data URL.
 */
export async function annotateImageWithMarkers(
  imageBuffer: Buffer,
  markers: AnnotationMarker[],
  mimeType: "image/png" | "image/jpeg" = "image/png"
): Promise<string> {
  if (markers.length === 0) {
    // No markers to draw, return original image as base64
    const base64 = imageBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 800;
  const height = metadata.height || 600;

  // Create SVG overlay with markers
  const markerSize = Math.max(24, Math.min(40, Math.floor(width / 30)));
  const fontSize = Math.floor(markerSize * 0.6);
  const strokeWidth = Math.max(2, Math.floor(markerSize / 12));

  const svgMarkers = markers
    .map((marker) => {
      const x = Math.round((marker.posX / 100) * width);
      const y = Math.round((marker.posY / 100) * height);
      const radius = markerSize / 2;

      return `
        <g>
          <circle cx="${x}" cy="${y}" r="${radius}" fill="#f97316" stroke="#ffffff" stroke-width="${strokeWidth}"/>
          <text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${marker.number}</text>
        </g>
      `;
    })
    .join("");

  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgMarkers}
    </svg>
  `;

  // Composite the SVG overlay onto the image
  const annotatedBuffer = await sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  const base64 = annotatedBuffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
