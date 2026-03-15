import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import { getChromePath, getUserDataDir } from "./paths";

export interface ProfileInfo {
  name: string;
  directory: string;
}

export function listProfiles(platform?: string): ProfileInfo[] {
  const userDataDir = getUserDataDir(platform);

  if (!fs.existsSync(userDataDir)) {
    return [];
  }

  const entries = fs.readdirSync(userDataDir, { withFileTypes: true });
  const profiles: ProfileInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Chrome profiles are either "Default" or "Profile N"
    const isDefault = entry.name === "Default";
    const isProfileDir = /^Profile \d+$/.test(entry.name);

    if (!isDefault && !isProfileDir) continue;

    // Verify it's a real profile by checking for a Preferences file
    const prefsPath = path.join(userDataDir, entry.name, "Preferences");
    if (!fs.existsSync(prefsPath)) continue;

    // Try to read the profile name from Preferences
    let displayName = entry.name;
    try {
      const prefs = JSON.parse(fs.readFileSync(prefsPath, "utf-8"));
      if (prefs?.profile?.name) {
        displayName = prefs.profile.name;
      }
    } catch {
      // If we can't read prefs, use the directory name
    }

    profiles.push({
      name: displayName,
      directory: entry.name,
    });
  }

  return profiles;
}

export function launchProfile(
  profileDirectory: string,
  platform?: string
): ChildProcess {
  const chromePath = getChromePath(platform);
  const userDataDir = getUserDataDir(platform);

  const args = [
    `--user-data-dir=${userDataDir}`,
    `--profile-directory=${profileDirectory}`,
  ];

  const child = spawn(chromePath, args, {
    detached: true,
    stdio: "ignore",
  });

  child.unref();
  return child;
}

export { getChromePath, getUserDataDir, chromeExists } from "./paths";
export { getPlatformPaths, getSupportedPlatforms } from "../config";
export type { PlatformPaths } from "../config";
