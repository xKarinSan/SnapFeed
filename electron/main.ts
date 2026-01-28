import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";
import type { BrowserWindow as BrowserWindowType } from "electron";

// Use require for Electron to avoid ES module interop issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { app, BrowserWindow, shell, desktopCapturer, ipcMain, session } = require("electron");

let mainWindow: BrowserWindowType | null = null;
let nextServer: ChildProcess | null = null;

const PORT = 3000;

// Check if running in development mode (must be called after app is ready or use environment)
function isDev(): boolean {
  return process.env.NODE_ENV === "development" || !app.isPackaged;
}

// Get user data directory (platform-specific)
function getUserDataPath(): string {
  return app.getPath("userData");
}

// Setup directories and environment for production
function setupProductionEnvironment(): void {
  const userDataPath = getUserDataPath();
  const dataDir = path.join(userDataPath, "data");
  const uploadsDir = path.join(userDataPath, "uploads", "screenshots");
  const prismaDir = path.join(userDataPath, "prisma");

  // Ensure directories exist
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(prismaDir, { recursive: true });

  // Set environment variables BEFORE Next.js loads
  const dbPath = path.join(dataDir, "snapfeed.db");
  process.env.DATABASE_URL = `file:${dbPath}`;

  // The key trick: change working directory so process.cwd() returns userData
  process.chdir(userDataPath);

  console.log("[Electron] User data path:", userDataPath);
  console.log("[Electron] Database path:", dbPath);
  console.log("[Electron] Working directory:", process.cwd());
}

// Copy Prisma migrations to userData if needed (first run)
function setupPrismaMigrations(): void {
  if (isDev()) return;

  const userDataPath = getUserDataPath();
  const targetPrismaDir = path.join(userDataPath, "prisma");
  const targetMigrationsDir = path.join(targetPrismaDir, "migrations");

  // Only copy if migrations don't exist
  if (!fs.existsSync(targetMigrationsDir)) {
    const sourcePrismaDir = path.join(process.resourcesPath, "prisma");
    const sourceMigrationsDir = path.join(sourcePrismaDir, "migrations");

    if (fs.existsSync(sourceMigrationsDir)) {
      // Copy migrations directory recursively
      copyDirSync(sourceMigrationsDir, targetMigrationsDir);
      console.log("[Electron] Copied Prisma migrations to userData");
    }

    // Copy schema.prisma
    const sourceSchema = path.join(sourcePrismaDir, "schema.prisma");
    const targetSchema = path.join(targetPrismaDir, "schema.prisma");
    if (fs.existsSync(sourceSchema)) {
      fs.copyFileSync(sourceSchema, targetSchema);
      console.log("[Electron] Copied schema.prisma to userData");
    }
  }
}

// Helper to copy directory recursively
function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Wait for server to be ready
function waitForServer(port: number, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.destroy();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - startTime >= timeout) {
          reject(new Error("Server startup timeout"));
        } else {
          setTimeout(checkServer, 200);
        }
      });

      req.end();
    };

    checkServer();
  });
}

async function startNextServer(): Promise<void> {
  if (isDev()) {
    // In dev, assume Next.js dev server is running separately
    console.log("[Electron] Development mode - expecting Next.js dev server on port", PORT);
    await waitForServer(PORT);
    return;
  }

  // Production: spawn the standalone server
  const serverPath = path.join(process.resourcesPath, "standalone", "server.js");

  console.log("[Electron] Starting Next.js standalone server from:", serverPath);

  nextServer = spawn(process.execPath.replace("Electron", "node").replace(/Electron\.app.*/, ""), [serverPath], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: "localhost",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
    cwd: path.join(process.resourcesPath, "standalone"),
  });

  nextServer.stdout?.on("data", (data) => {
    console.log("[Next.js]", data.toString().trim());
  });

  nextServer.stderr?.on("data", (data) => {
    console.error("[Next.js Error]", data.toString().trim());
  });

  nextServer.on("error", (error) => {
    console.error("[Electron] Failed to start Next.js server:", error);
  });

  nextServer.on("exit", (code) => {
    console.log("[Electron] Next.js server exited with code:", code);
  });

  await waitForServer(PORT);
  console.log("[Electron] Next.js server is ready");
}

async function createWindow(): Promise<void> {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    show: false,
    backgroundColor: "#ffffff",
  });

  mainWindow = win;

  // Set up display media request handler to bypass system picker
  session.defaultSession.setDisplayMediaRequestHandler(
    async (request: { frame: { url: string } }, callback: (opts: { video: { id: string; name: string } | null }) => void) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ["screen"] });
        if (sources.length > 0) {
          callback({ video: sources[0] });
        } else {
          callback({ video: null });
        }
      } catch (error) {
        console.error("[Electron] Display media request failed:", error);
        callback({ video: null });
      }
    },
    { useSystemPicker: false }
  );

  win.loadURL(`http://localhost:${PORT}`);

  win.once("ready-to-show", () => {
    win.show();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (url.startsWith("http://localhost")) {
      return { action: "allow" as const };
    }
    shell.openExternal(url);
    return { action: "deny" as const };
  });

  win.on("closed", () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (isDev()) {
    win.webContents.openDevTools();
  }
}

// Run Prisma migrations
async function runMigrations(): Promise<void> {
  if (isDev()) return;

  // For production, we use prisma migrate deploy
  // The Prisma CLI should be available in the resources
  return new Promise((resolve) => {
    const prismaPath = path.join(process.resourcesPath, "node_modules", "prisma", "build", "index.js");

    if (!fs.existsSync(prismaPath)) {
      console.log("[Electron] Prisma CLI not found at:", prismaPath);
      console.log("[Electron] Skipping migrations - database may need manual setup");
      resolve();
      return;
    }

    const userDataPath = getUserDataPath();
    const schemaPath = path.join(userDataPath, "prisma", "schema.prisma");

    console.log("[Electron] Running Prisma migrations...");

    const migration = spawn("node", [prismaPath, "migrate", "deploy", "--schema", schemaPath], {
      env: process.env,
      stdio: "inherit",
    });

    migration.on("close", (code) => {
      if (code === 0) {
        console.log("[Electron] Migrations completed successfully");
        resolve();
      } else {
        console.log("[Electron] Migration exited with code:", code);
        // Don't reject - the app might still work with existing database
        resolve();
      }
    });

    migration.on("error", (error) => {
      console.error("[Electron] Migration error:", error);
      resolve(); // Don't reject - try to continue
    });
  });
}

// IPC handler for screen capture - captures only the window content
ipcMain.handle("capture-screen", async (_event: unknown, rect?: { x: number; y: number; width: number; height: number }) => {
  try {
    if (!mainWindow) {
      console.error("[Electron] No main window available");
      return null;
    }

    // Capture the visible page content
    const image = await mainWindow.webContents.capturePage(rect);
    return image.toDataURL();
  } catch (error) {
    console.error("[Electron] Failed to capture screen:", error);
    return null;
  }
});

app.whenReady().then(async () => {
  try {
    if (!isDev()) {
      setupProductionEnvironment();
      setupPrismaMigrations();
      await runMigrations();
    }

    await startNextServer();
    await createWindow();
  } catch (error) {
    console.error("[Electron] Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    console.log("[Electron] Stopping Next.js server...");
    nextServer.kill();
  }
});
