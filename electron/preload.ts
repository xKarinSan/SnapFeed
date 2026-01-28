import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  captureScreen: async (rect?: { x: number; y: number; width: number; height: number }): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke("capture-screen", rect);
    } catch (error) {
      console.error("Failed to capture screen:", error);
      return null;
    }
  },
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: NodeJS.Platform;
      captureScreen: (rect?: { x: number; y: number; width: number; height: number }) => Promise<string | null>;
    };
  }
}
