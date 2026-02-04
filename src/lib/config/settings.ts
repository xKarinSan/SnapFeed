import fs from "fs";
import path from "path";

export interface LarkSettings {
  appId: string;
  appSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export interface AppSettings {
  extensionId: string;
  lark?: LarkSettings;
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

  // Deep merge for lark settings to preserve tokens when updating app credentials
  const updated: AppSettings = {
    ...current,
    ...updates,
  };

  // If updating lark, merge with existing lark settings
  if (updates.lark && current.lark) {
    updated.lark = {
      ...current.lark,
      ...updates.lark,
    };
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));

  return updated;
}
