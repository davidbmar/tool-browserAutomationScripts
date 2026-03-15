import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as child_process from "child_process";

// Mock fs and child_process before importing modules
vi.mock("fs");
vi.mock("child_process");

import { getPlatformPaths, getSupportedPlatforms } from "../src/core/config";
import { getChromePath, getUserDataDir, chromeExists } from "../src/core/launcher/paths";
import { listProfiles, launchProfile } from "../src/core/launcher/index";

describe("config", () => {
  it("returns macOS paths for darwin platform", () => {
    const paths = getPlatformPaths("darwin");
    expect(paths.chromeBinary).toBe(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    );
    expect(paths.userDataDir).toBe(
      path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome")
    );
  });

  it("throws for unsupported platform", () => {
    expect(() => getPlatformPaths("freebsd")).toThrow("Unsupported platform: freebsd");
  });

  it("lists supported platforms", () => {
    const platforms = getSupportedPlatforms();
    expect(platforms).toContain("darwin");
  });
});

describe("launcher/paths", () => {
  it("getChromePath returns the macOS Chrome binary path", () => {
    const chromePath = getChromePath("darwin");
    expect(chromePath).toBe(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    );
  });

  it("getUserDataDir returns macOS user data directory", () => {
    const dataDir = getUserDataDir("darwin");
    expect(dataDir).toContain("Google/Chrome");
  });

  it("chromeExists returns true when binary exists", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    expect(chromeExists("darwin")).toBe(true);
  });

  it("chromeExists returns false when binary is missing", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(chromeExists("darwin")).toBe(false);
  });
});

describe("listProfiles", () => {
  const userDataDir = path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Google",
    "Chrome"
  );

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReset();
    vi.mocked(fs.readdirSync).mockReset();
    vi.mocked(fs.readFileSync).mockReset();
  });

  it("returns empty array when user data dir does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const profiles = listProfiles("darwin");
    expect(profiles).toEqual([]);
  });

  it("discovers Default and Profile N directories", () => {
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      const s = p.toString();
      if (s === userDataDir) return true;
      if (s.endsWith("Preferences")) return true;
      return false;
    });

    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: "Default", isDirectory: () => true, isFile: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "", parentPath: "" },
      { name: "Profile 1", isDirectory: () => true, isFile: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "", parentPath: "" },
      { name: "Profile 2", isDirectory: () => true, isFile: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "", parentPath: "" },
      { name: "Crashpad", isDirectory: () => true, isFile: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "", parentPath: "" },
    ] as unknown as fs.Dirent[]);

    vi.mocked(fs.readFileSync).mockImplementation((p: fs.PathOrFileDescriptor) => {
      const s = p.toString();
      if (s.includes("Default")) return JSON.stringify({ profile: { name: "Person 1" } });
      if (s.includes("Profile 1")) return JSON.stringify({ profile: { name: "Work" } });
      if (s.includes("Profile 2")) return JSON.stringify({ profile: { name: "Personal" } });
      return "{}";
    });

    const profiles = listProfiles("darwin");
    expect(profiles).toHaveLength(3);
    expect(profiles[0]).toEqual({ name: "Person 1", directory: "Default" });
    expect(profiles[1]).toEqual({ name: "Work", directory: "Profile 1" });
    expect(profiles[2]).toEqual({ name: "Personal", directory: "Profile 2" });
  });

  it("uses directory name when Preferences cannot be parsed", () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    vi.mocked(fs.readdirSync).mockReturnValue([
      { name: "Default", isDirectory: () => true, isFile: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "", parentPath: "" },
    ] as unknown as fs.Dirent[]);

    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("bad json");
    });

    const profiles = listProfiles("darwin");
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toEqual({ name: "Default", directory: "Default" });
  });
});

describe("launchProfile", () => {
  it("spawns Chrome with correct args", () => {
    const mockChild = { unref: vi.fn(), pid: 12345 };
    vi.mocked(child_process.spawn).mockReturnValue(mockChild as any);

    const child = launchProfile("Default", "darwin");

    expect(child_process.spawn).toHaveBeenCalledWith(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      [
        `--user-data-dir=${path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome")}`,
        "--profile-directory=Default",
      ],
      { detached: true, stdio: "ignore" }
    );
    expect(mockChild.unref).toHaveBeenCalled();
    expect(child).toBe(mockChild);
  });
});
