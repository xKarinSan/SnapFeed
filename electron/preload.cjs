"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    isElectron: true,
    platform: process.platform,
    captureScreen: async (rect) => {
        try {
            return await electron_1.ipcRenderer.invoke("capture-screen", rect);
        }
        catch (error) {
            console.error("Failed to capture screen:", error);
            return null;
        }
    },
});
