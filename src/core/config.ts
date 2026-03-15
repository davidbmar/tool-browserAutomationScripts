import * as path from "path";
import * as os from "os";

export interface PlatformPaths {
  chromeBinary: string;
  userDataDir: string;
}

const PLATFORM_PATHS: Record<string, PlatformPaths> = {
  darwin: {
    chromeBinary:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    userDataDir: path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Google",
      "Chrome"
    ),
  },
};

export function getPlatformPaths(
  platform: string = process.platform
): PlatformPaths {
  const paths = PLATFORM_PATHS[platform];
  if (!paths) {
    throw new Error(
      `Unsupported platform: ${platform}. Currently supported: ${Object.keys(PLATFORM_PATHS).join(", ")}`
    );
  }
  return paths;
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(PLATFORM_PATHS);
}
