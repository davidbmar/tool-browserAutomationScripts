import { execFileSync } from "child_process";
import crypto from "crypto";

const CHROME_SALT = "saltysalt";
const CHROME_ITERATIONS = 1003;
const CHROME_KEY_LENGTH = 16;
// Chrome uses a 16-byte IV of all spaces (0x20)
const CHROME_IV = Buffer.alloc(16, " ");
// v10 prefix indicates Chrome macOS encryption
const V10_PREFIX = Buffer.from("v10");

/**
 * Retrieves Chrome's Safe Storage password from the macOS Keychain.
 * This is the base password Chrome uses for cookie encryption.
 */
export function getChromeSafeStorageKey(): string {
  try {
    const output = execFileSync(
      "security",
      ["find-generic-password", "-s", "Chrome Safe Storage", "-w"],
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return output.trim();
  } catch {
    throw new Error(
      "Failed to retrieve Chrome Safe Storage key from Keychain. " +
        "Ensure Chrome has been run at least once and Keychain access is available."
    );
  }
}

/**
 * Derives the AES-128-CBC encryption key from Chrome's Safe Storage password
 * using PBKDF2 with Chrome's fixed salt and iteration count.
 */
export function deriveKey(safeStoragePassword: string): Buffer {
  return crypto.pbkdf2Sync(
    safeStoragePassword,
    CHROME_SALT,
    CHROME_ITERATIONS,
    CHROME_KEY_LENGTH,
    "sha1"
  );
}

/**
 * Decrypts a Chrome cookie value encrypted with v10 scheme on macOS.
 *
 * @param encryptedBuffer - The raw encrypted_value from the Cookies SQLite DB
 * @param derivedKey - The AES key derived via deriveKey()
 * @returns The decrypted cookie string, or "<encrypted>" if decryption fails
 */
export function decryptCookieValue(
  encryptedBuffer: Buffer,
  derivedKey: Buffer
): string {
  // Unencrypted cookies are stored as plain text (no prefix)
  if (!encryptedBuffer || encryptedBuffer.length === 0) {
    return "";
  }

  // Check for v10 prefix
  const hasV10Prefix =
    encryptedBuffer.length >= 3 &&
    encryptedBuffer.subarray(0, 3).equals(V10_PREFIX);

  if (!hasV10Prefix) {
    // Not a v10-encrypted value — return as UTF-8 string
    return encryptedBuffer.toString("utf-8");
  }

  // Strip the 3-byte "v10" prefix to get the AES-CBC ciphertext
  const ciphertext = encryptedBuffer.subarray(3);

  try {
    const decipher = crypto.createDecipheriv("aes-128-cbc", derivedKey, CHROME_IV);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf-8");
  } catch {
    // Graceful degradation: return placeholder when decryption fails
    return "<encrypted>";
  }
}
