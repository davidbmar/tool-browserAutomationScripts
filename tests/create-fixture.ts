/**
 * Generates a test fixture SQLite database that mimics Chrome's Cookies DB.
 * Uses a known password so tests can decrypt without Keychain access.
 */
import crypto from "crypto";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

export const FIXTURE_PASSWORD = "test-safe-storage-password";
export const FIXTURE_DB_PATH = path.join(__dirname, "fixtures", "Cookies");

const CHROME_SALT = "saltysalt";
const CHROME_ITERATIONS = 1003;
const CHROME_KEY_LENGTH = 16;
const CHROME_IV = Buffer.alloc(16, " ");

function encryptValue(plaintext: string, derivedKey: Buffer): Buffer {
  const cipher = crypto.createCipheriv("aes-128-cbc", derivedKey, CHROME_IV);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  // Prepend "v10" prefix like Chrome does
  return Buffer.concat([Buffer.from("v10"), encrypted]);
}

export function createFixtureDb(): void {
  const derivedKey = crypto.pbkdf2Sync(
    FIXTURE_PASSWORD,
    CHROME_SALT,
    CHROME_ITERATIONS,
    CHROME_KEY_LENGTH,
    "sha1"
  );

  const dir = path.dirname(FIXTURE_DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(FIXTURE_DB_PATH)) {
    fs.unlinkSync(FIXTURE_DB_PATH);
  }

  const db = new Database(FIXTURE_DB_PATH);

  // Create Chrome's cookies table schema (simplified)
  db.exec(`
    CREATE TABLE cookies (
      creation_utc INTEGER NOT NULL,
      host_key TEXT NOT NULL DEFAULT '',
      top_frame_site_key TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      value TEXT NOT NULL DEFAULT '',
      encrypted_value BLOB NOT NULL DEFAULT X'',
      path TEXT NOT NULL DEFAULT '/',
      expires_utc INTEGER NOT NULL DEFAULT 0,
      is_secure INTEGER NOT NULL DEFAULT 0,
      is_httponly INTEGER NOT NULL DEFAULT 0,
      last_access_utc INTEGER NOT NULL DEFAULT 0,
      has_expires INTEGER NOT NULL DEFAULT 1,
      is_persistent INTEGER NOT NULL DEFAULT 1,
      priority INTEGER NOT NULL DEFAULT 1,
      samesite INTEGER NOT NULL DEFAULT -1,
      source_scheme INTEGER NOT NULL DEFAULT 0,
      source_port INTEGER NOT NULL DEFAULT -1,
      last_update_utc INTEGER NOT NULL DEFAULT 0,
      source_type INTEGER NOT NULL DEFAULT 0,
      has_cross_site_ancestor INTEGER NOT NULL DEFAULT 0
    )
  `);

  const insert = db.prepare(`
    INSERT INTO cookies (creation_utc, host_key, name, value, encrypted_value, path, expires_utc, is_secure, is_httponly)
    VALUES (?, ?, ?, '', ?, '/', ?, ?, ?)
  `);

  // Test cookies with known plaintext values
  const cookies = [
    {
      host: ".example.com",
      name: "session_id",
      value: "abc123session",
      expires: 13350000000000000,
      secure: 1,
      httponly: 1,
    },
    {
      host: ".example.com",
      name: "user_pref",
      value: "dark-mode",
      expires: 13350000000000000,
      secure: 0,
      httponly: 0,
    },
    {
      host: "example.com",
      name: "tracking",
      value: "opt-out",
      expires: 13350000000000000,
      secure: 1,
      httponly: 0,
    },
    {
      host: ".other-domain.com",
      name: "other_cookie",
      value: "should-not-appear",
      expires: 13350000000000000,
      secure: 0,
      httponly: 0,
    },
  ];

  const now = Date.now() * 1000; // Chrome uses microseconds
  for (const cookie of cookies) {
    const encrypted = encryptValue(cookie.value, derivedKey);
    insert.run(
      now,
      cookie.host,
      cookie.name,
      encrypted,
      cookie.expires,
      cookie.secure,
      cookie.httponly
    );
  }

  db.close();
  console.log(`Fixture DB created at ${FIXTURE_DB_PATH}`);
  console.log(`  Password: ${FIXTURE_PASSWORD}`);
  console.log(`  Cookies: ${cookies.length} entries`);
}

// Run if executed directly
if (require.main === module) {
  createFixtureDb();
}
