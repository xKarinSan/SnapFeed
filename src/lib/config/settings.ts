import fs from "fs";
import path from "path";

export interface AppSettings {
  extensionId: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  extensionId: "",
};

const CONFIG_DIR = path.join(process.cwd(), "config");
const CONFIG_FILE = path.join(CONFIG_DIR, "settings.json");

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getSettings(): AppSettings {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    // Create default settings file
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, "utf-8");
    const settings = JSON.parse(content) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function updateSettings(updates: Partial<AppSettings>): AppSettings {
  ensureConfigDir();

  const current = getSettings();
  const updated = { ...current, ...updates };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));

  return updated;
}
