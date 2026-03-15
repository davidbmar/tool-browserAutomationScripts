import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { execFileSync } from 'child_process';

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
}

const CHROME_BASE_DIR = path.join(
  os.homedir(),
  'Library',
  'Application Support',
  'Google',
  'Chrome'
);

/**
 * Retrieve the Chrome Safe Storage password from macOS Keychain.
 * Uses execFileSync (no shell) to avoid command injection.
 */
function getChromePassword(): string {
  const result = execFileSync(
    'security',
    ['find-generic-password', '-s', 'Chrome Safe Storage', '-w'],
    { encoding: 'utf-8' }
  ).trim();
  return result;
}

/**
 * Derive the AES key from the Chrome Safe Storage password.
 * macOS Chrome uses PBKDF2 with 1003 iterations, salt "saltysalt", 16-byte key.
 */
function deriveKey(password: string): Buffer {
  return crypto.pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
}

/**
 * Decrypt a Chrome cookie value (v10 format on macOS).
 * v10 cookies use AES-128-CBC with a 16-byte IV of spaces (0x20).
 */
function decryptValue(encryptedValue: Buffer, key: Buffer): string {
  if (encryptedValue.length === 0) {
    return '';
  }

  // v10 prefix indicates macOS Chrome encryption
  const prefix = encryptedValue.subarray(0, 3).toString('utf-8');
  if (prefix !== 'v10') {
    // Not encrypted, return as-is
    return encryptedValue.toString('utf-8');
  }

  const ciphertext = encryptedValue.subarray(3);
  const iv = Buffer.alloc(16, 0x20); // 16 spaces

  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(true);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf-8');
}

/**
 * Get decrypted cookies for a given domain from a Chrome profile.
 *
 * @param domain - Domain to filter cookies for (e.g. "rippling.com")
 * @param profileDir - Chrome profile directory name (default: "Default")
 */
export function getCookies(domain: string, profileDir: string = 'Default'): Cookie[] {
  const cookieDbPath = path.join(CHROME_BASE_DIR, profileDir, 'Cookies');

  // Chrome locks the Cookies DB, so we copy it to a temp location
  const tmpDir = os.tmpdir();
  const tmpDbPath = path.join(tmpDir, `chrome_cookies_${Date.now()}.db`);

  fs.copyFileSync(cookieDbPath, tmpDbPath);

  // Use dynamic require for better-sqlite3 (native module)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  let db: any = null;

  try {
    const password = getChromePassword();
    const key = deriveKey(password);

    db = new Database(tmpDbPath, { readonly: true });

    const rows = db.prepare(
      `SELECT name, encrypted_value, host_key, path, expires_utc, is_httponly, is_secure
       FROM cookies
       WHERE host_key LIKE ?`
    ).all(`%${domain}%`) as Array<{
      name: string;
      encrypted_value: Buffer;
      host_key: string;
      path: string;
      expires_utc: number;
      is_httponly: number;
      is_secure: number;
    }>;

    const cookies: Cookie[] = rows.map(row => ({
      name: row.name,
      value: decryptValue(row.encrypted_value, key),
      domain: row.host_key,
      path: row.path,
      expires: row.expires_utc,
      httpOnly: row.is_httponly === 1,
      secure: row.is_secure === 1,
    }));

    return cookies;
  } finally {
    if (db) db.close();
    try { fs.unlinkSync(tmpDbPath); } catch { /* ignore cleanup errors */ }
  }
}
