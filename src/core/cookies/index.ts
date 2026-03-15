import { getChromeSafeStorageKey, deriveKey, decryptCookieValue } from "./decrypt-macos";
import { getCookieDbPath, readCookieRows } from "./db";

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires_utc: number;
  is_secure: boolean;
  is_httponly: boolean;
}

export interface GetCookiesOptions {
  /** Path to a custom Cookies DB (overrides profile-based lookup) */
  dbPath?: string;
  /** Pre-derived encryption key (skips Keychain lookup) */
  derivedKey?: Buffer;
}

/**
 * Public API: Retrieves and decrypts Chrome cookies for a given profile and domain.
 *
 * @param profileName - Chrome profile name (e.g., "Default", "Profile 1")
 * @param domain - Domain to filter cookies for (e.g., "example.com")
 * @param options - Optional overrides for DB path and encryption key
 * @returns Array of decrypted cookies
 */
export function getCookies(
  profileName: string,
  domain: string,
  options?: GetCookiesOptions
): Cookie[] {
  const dbPath = options?.dbPath ?? getCookieDbPath(profileName);

  let key: Buffer;
  if (options?.derivedKey) {
    key = options.derivedKey;
  } else {
    try {
      const safeStoragePassword = getChromeSafeStorageKey();
      key = deriveKey(safeStoragePassword);
    } catch {
      // Keychain inaccessible — we'll return <encrypted> placeholders
      key = Buffer.alloc(16, 0);
    }
  }

  const rows = readCookieRows(dbPath, domain);

  return rows.map((row) => ({
    name: row.name,
    value: decryptCookieValue(row.encrypted_value, key),
    domain: row.host_key,
    path: row.path,
    expires_utc: row.expires_utc,
    is_secure: Boolean(row.is_secure),
    is_httponly: Boolean(row.is_httponly),
  }));
}

// Re-export internals for direct use
export { getChromeSafeStorageKey, deriveKey, decryptCookieValue } from "./decrypt-macos";
export { getCookieDbPath, readCookieRows } from "./db";
