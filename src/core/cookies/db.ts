import path from "path";
import os from "os";
import fs from "fs";
import Database from "better-sqlite3";

export interface CookieRow {
  name: string;
  encrypted_value: Buffer;
  host_key: string;
  path: string;
  expires_utc: number;
  is_secure: number;
  is_httponly: number;
}

/**
 * Returns the path to Chrome's Cookies SQLite DB for the given profile.
 */
export function getCookieDbPath(profile: string = "Default"): string {
  return path.join(
    os.homedir(),
    "Library",
    "Application Support",
    "Google",
    "Chrome",
    profile,
    "Cookies"
  );
}

/**
 * Reads cookie rows for a given domain from a Chrome Cookies database.
 *
 * Copies the DB to a temp location first to avoid Chrome's file lock,
 * then cleans up the temp copy after reading.
 */
export function readCookieRows(
  dbPath: string,
  domain: string
): CookieRow[] {
  // Copy DB to temp to avoid Chrome's lock
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "chrome-cookies-"));
  const tmpDbPath = path.join(tmpDir, "Cookies");

  try {
    fs.copyFileSync(dbPath, tmpDbPath);

    // Also copy WAL/SHM if they exist (Chrome uses WAL mode)
    for (const suffix of ["-wal", "-shm"]) {
      const src = dbPath + suffix;
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(tmpDir, "Cookies" + suffix));
      }
    }

    const db = new Database(tmpDbPath, { readonly: true });

    try {
      // Match domain and subdomains (e.g., ".example.com" and "example.com")
      const stmt = db.prepare(
        `SELECT name, encrypted_value, host_key, path, expires_utc, is_secure, is_httponly
         FROM cookies
         WHERE host_key = ? OR host_key = ?`
      );

      const domainWithDot = domain.startsWith(".") ? domain : `.${domain}`;
      const domainWithoutDot = domain.startsWith(".")
        ? domain.slice(1)
        : domain;

      const rows = stmt.all(domainWithoutDot, domainWithDot) as CookieRow[];
      return rows;
    } finally {
      db.close();
    }
  } finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch {
      // Best-effort cleanup
    }
  }
}
