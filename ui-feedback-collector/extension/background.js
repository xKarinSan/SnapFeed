// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === "captureScreenshot") {
      console.log("Screenshot request received:", request.crop);

      // Get the current active tab and capture it
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          sendResponse({ error: "No active tab found" });
          return;
        }

        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }

          console.log("Tab captured, dataUrl length:", dataUrl.length);

          // If crop dimensions provided, crop the image
          if (request.crop) {
            cropImage(dataUrl, request.crop)
              .then((croppedDataUrl) => {
                console.log("Cropped successfully, new length:", croppedDataUrl.length);
                sendResponse({ dataUrl: croppedDataUrl });
              })
              .catch((error) => {
                console.error("Crop error:", error);
                sendResponse({ error: error.message });
              });
          } else {
            sendResponse({ dataUrl });
          }
        });
      });

      // Return true to indicate async response
      return true;
    }

    if (request.action === "ping") {
      sendResponse({ status: "ok" });
      return;
    }
  }
);

// Crop image using OffscreenCanvas
async function cropImage(dataUrl, crop) {
  const { x, y, width, height, scale } = crop;

  // Fetch the image
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  console.log("Original image size:", bitmap.width, "x", bitmap.height);
  console.log("Crop params:", { x, y, width, height, scale });

  // Calculate scaled crop dimensions
  const cropX = Math.round(x * scale);
  const cropY = Math.round(y * scale);
  const cropWidth = Math.round(width * scale);
  const cropHeight = Math.round(height * scale);

  console.log("Calculated crop:", { cropX, cropY, cropWidth, cropHeight });

  // Validate crop dimensions
  if (cropX + cropWidth > bitmap.width || cropY + cropHeight > bitmap.height) {
    console.warn("Crop extends beyond image bounds, adjusting...");
  }

  // Clamp values to image bounds
  const finalCropX = Math.max(0, Math.min(cropX, bitmap.width));
  const finalCropY = Math.max(0, Math.min(cropY, bitmap.height));
  const finalCropWidth = Math.min(cropWidth, bitmap.width - finalCropX);
  const finalCropHeight = Math.min(cropHeight, bitmap.height - finalCropY);

  console.log("Final crop:", { finalCropX, finalCropY, finalCropWidth, finalCropHeight });

  // Create offscreen canvas and crop
  const canvas = new OffscreenCanvas(finalCropWidth, finalCropHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    bitmap,
    finalCropX,
    finalCropY,
    finalCropWidth,
    finalCropHeight,
    0,
    0,
    finalCropWidth,
    finalCropHeight
  );

  // Convert to blob then data URL
  const croppedBlob = await canvas.convertToBlob({ type: "image/png" });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}
