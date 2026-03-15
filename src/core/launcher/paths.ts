import * as fs from "fs";
import { getPlatformPaths } from "../config";

export function getChromePath(platform?: string): string {
  const paths = getPlatformPaths(platform);
  return paths.chromeBinary;
}

export function getUserDataDir(platform?: string): string {
  const paths = getPlatformPaths(platform);
  return paths.userDataDir;
}

export function chromeExists(platform?: string): boolean {
  try {
    return fs.existsSync(getChromePath(platform));
  } catch {
    return false;
  }
}
