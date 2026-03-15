import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface ChromeProfile {
  directory: string;
  name: string;
  path: string;
}

const CHROME_BASE_DIR = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Google',
  'Chrome'
);

/**
 * List all Chrome profiles found on this macOS system.
 * Reads each profile's Preferences file to extract the display name.
 */
export function listProfiles(): ChromeProfile[] {
  if (!fs.existsSync(CHROME_BASE_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CHROME_BASE_DIR, { withFileTypes: true });
  const profiles: ChromeProfile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Chrome profile dirs are "Default" or "Profile N"
    if (entry.name !== 'Default' && !entry.name.startsWith('Profile ')) continue;

    const profilePath = path.join(CHROME_BASE_DIR, entry.name);
    const prefsPath = path.join(profilePath, 'Preferences');

    let displayName = entry.name;
    if (fs.existsSync(prefsPath)) {
      try {
        const prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
        displayName = prefs?.profile?.name || entry.name;
      } catch {
        // If prefs can't be parsed, fall back to directory name
      }
    }

    profiles.push({
      directory: entry.name,
      name: displayName,
      path: profilePath,
    });
  }

  return profiles.sort((a, b) => {
    if (a.directory === 'Default') return -1;
    if (b.directory === 'Default') return 1;
    return a.directory.localeCompare(b.directory);
  });
}
