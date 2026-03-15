import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

const CHROME_APP = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CHROME_BASE_DIR = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Google',
  'Chrome'
);

export interface LaunchOptions {
  url?: string;
}

/**
 * Launch Chrome with a specific profile directory.
 *
 * @param profileDir - Profile directory name (e.g. "Default", "Profile 1")
 * @param options - Optional launch options (url to open)
 * @returns The spawned process PID
 */
export function launchProfile(profileDir: string, options: LaunchOptions = {}): number {
  const profilePath = path.join(CHROME_BASE_DIR, profileDir);

  const args = [
    `--profile-directory=${profileDir}`,
  ];

  if (options.url) {
    args.push(options.url);
  }

  const child = spawn(CHROME_APP, args, {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();
  return child.pid ?? 0;
}
