import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";
import path from "path";
import { createFixtureDb, FIXTURE_PASSWORD, FIXTURE_DB_PATH } from "./create-fixture";
import { deriveKey, decryptCookieValue } from "../src/core/cookies/decrypt-macos";
import { readCookieRows } from "../src/core/cookies/db";
import { getCookies } from "../src/core/cookies/index";

const CHROME_SALT = "saltysalt";
const CHROME_ITERATIONS = 1003;
const CHROME_KEY_LENGTH = 16;
const CHROME_IV = Buffer.alloc(16, " ");

/** Helper: encrypt a value the same way Chrome does */
function encryptForTest(plaintext: string, key: Buffer): Buffer {
  const cipher = crypto.createCipheriv("aes-128-cbc", key, CHROME_IV);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  return Buffer.concat([Buffer.from("v10"), encrypted]);
}

describe("Cookie Decryption", () => {
  let derivedKeyFromFixture: Buffer;

  beforeAll(() => {
    // Generate fixture DB before tests
    createFixtureDb();
    derivedKeyFromFixture = deriveKey(FIXTURE_PASSWORD);
  });

  describe("deriveKey()", () => {
    it("derives a 16-byte key using PBKDF2", () => {
      const key = deriveKey("test-password");
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(16);
    });

    it("produces deterministic output for same password", () => {
      const key1 = deriveKey(FIXTURE_PASSWORD);
      const key2 = deriveKey(FIXTURE_PASSWORD);
      expect(key1.equals(key2)).toBe(true);
    });

    it("produces different keys for different passwords", () => {
      const key1 = deriveKey("password-a");
      const key2 = deriveKey("password-b");
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe("decryptCookieValue()", () => {
    it("decrypts a v10-prefixed encrypted value", () => {
      const key = derivedKeyFromFixture;
      const encrypted = encryptForTest("hello-world", key);
      const result = decryptCookieValue(encrypted, key);
      expect(result).toBe("hello-world");
    });

    it("handles v10 prefix correctly (strips 3-byte prefix before AES-CBC)", () => {
      const key = derivedKeyFromFixture;
      const encrypted = encryptForTest("test-value", key);
      // Verify the buffer starts with "v10"
      expect(encrypted.subarray(0, 3).toString()).toBe("v10");
      // Verify decryption works after stripping prefix
      const result = decryptCookieValue(encrypted, key);
      expect(result).toBe("test-value");
    });

    it("returns empty string for empty buffer", () => {
      const key = derivedKeyFromFixture;
      expect(decryptCookieValue(Buffer.alloc(0), key)).toBe("");
    });

    it("returns UTF-8 string for non-v10 values", () => {
      const key = derivedKeyFromFixture;
      const plainBuf = Buffer.from("plain-cookie-value");
      expect(decryptCookieValue(plainBuf, key)).toBe("plain-cookie-value");
    });

    it("returns <encrypted> placeholder when decryption fails (wrong key)", () => {
      const correctKey = derivedKeyFromFixture;
      const wrongKey = deriveKey("wrong-password");
      const encrypted = encryptForTest("secret-data", correctKey);
      const result = decryptCookieValue(encrypted, wrongKey);
      expect(result).toBe("<encrypted>");
    });
  });

  describe("readCookieRows()", () => {
    it("reads cookie rows for a domain from the fixture DB", () => {
      const rows = readCookieRows(FIXTURE_DB_PATH, "example.com");
      expect(rows.length).toBe(3); // .example.com (2) + example.com (1)
    });

    it("matches both bare domain and dot-prefixed domain", () => {
      const rows = readCookieRows(FIXTURE_DB_PATH, "example.com");
      const hosts = rows.map((r) => r.host_key);
      expect(hosts).toContain(".example.com");
      expect(hosts).toContain("example.com");
    });

    it("does not return cookies for other domains", () => {
      const rows = readCookieRows(FIXTURE_DB_PATH, "example.com");
      const hosts = rows.map((r) => r.host_key);
      expect(hosts).not.toContain(".other-domain.com");
    });

    it("returns encrypted_value as Buffer", () => {
      const rows = readCookieRows(FIXTURE_DB_PATH, "example.com");
      for (const row of rows) {
        expect(row.encrypted_value).toBeInstanceOf(Buffer);
      }
    });
  });

  describe("getCookies() — public API", () => {
    it("returns decrypted cookie name/value pairs for example.com", () => {
      const cookies = getCookies("Default", "example.com", {
        dbPath: FIXTURE_DB_PATH,
        derivedKey: derivedKeyFromFixture,
      });

      expect(cookies.length).toBe(3);

      const sessionCookie = cookies.find((c) => c.name === "session_id");
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie!.value).toBe("abc123session");

      const prefCookie = cookies.find((c) => c.name === "user_pref");
      expect(prefCookie).toBeDefined();
      expect(prefCookie!.value).toBe("dark-mode");

      const trackingCookie = cookies.find((c) => c.name === "tracking");
      expect(trackingCookie).toBeDefined();
      expect(trackingCookie!.value).toBe("opt-out");
    });

    it("returns correct boolean fields", () => {
      const cookies = getCookies("Default", "example.com", {
        dbPath: FIXTURE_DB_PATH,
        derivedKey: derivedKeyFromFixture,
      });

      const sessionCookie = cookies.find((c) => c.name === "session_id")!;
      expect(sessionCookie.is_secure).toBe(true);
      expect(sessionCookie.is_httponly).toBe(true);

      const prefCookie = cookies.find((c) => c.name === "user_pref")!;
      expect(prefCookie.is_secure).toBe(false);
      expect(prefCookie.is_httponly).toBe(false);
    });

    it("returns domain and path from the DB", () => {
      const cookies = getCookies("Default", "example.com", {
        dbPath: FIXTURE_DB_PATH,
        derivedKey: derivedKeyFromFixture,
      });

      const sessionCookie = cookies.find((c) => c.name === "session_id")!;
      expect(sessionCookie.domain).toBe(".example.com");
      expect(sessionCookie.path).toBe("/");
    });

    it("gracefully degrades with wrong key (returns <encrypted>)", () => {
      const wrongKey = deriveKey("wrong-password");
      const cookies = getCookies("Default", "example.com", {
        dbPath: FIXTURE_DB_PATH,
        derivedKey: wrongKey,
      });

      // All values should be <encrypted> since the key is wrong
      for (const cookie of cookies) {
        expect(cookie.value).toBe("<encrypted>");
      }
    });

    it("does not return cookies for unrelated domains", () => {
      const cookies = getCookies("Default", "nonexistent.com", {
        dbPath: FIXTURE_DB_PATH,
        derivedKey: derivedKeyFromFixture,
      });

      expect(cookies.length).toBe(0);
    });
  });
});
