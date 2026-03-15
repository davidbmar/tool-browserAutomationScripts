agentB-cookie-decrypt — Sprint 1

Sprint-Level Context

Goal
- Build the core engine: Chrome profile launcher, cookie decryption, and CLI
- Design as a library from day one — core module exports usable by MCP, CLI, or direct import
- macOS-first, Node.js >= 18, custom crypto (no browser_cookie3)
- All three interfaces share the same core functions

Constraints
- No two agents may modify the same files
- No Puppeteer/Playwright yet (Sprint 3)
- No browser_cookie3 — write cookie decryption from scratch
- macOS only for cookie decryption
- Use native Node.js crypto for PBKDF2 and AES-CBC


Objective
- Build Chrome cookie decryption module for macOS using native Node.js crypto

Tasks
- Create `src/core/cookies/decrypt-macos.ts` with `getChromeSafeStorageKey()` calling macOS `security` CLI, `deriveKey()` using PBKDF2 (salt="saltysalt", iterations=1003, dklen=16), and `decryptCookieValue(encryptedBuffer)` using AES-128-CBC
- Create `src/core/cookies/db.ts` with `getCookieDbPath(profile)` and `readCookieRows(dbPath, domain)` using `better-sqlite3` — copies DB to temp to avoid Chrome lock, cleans up after
- Create `src/core/cookies/index.ts` with `getCookies(profileName, domain, options?)` as the public API combining db read + decryption
- Add tests in `tests/cookies.test.ts` with fixture SQLite DB containing known encrypted values
- Create `tests/create-fixture.ts` to generate test fixture DB

Acceptance Criteria
- `getCookies('Default', 'example.com')` returns decrypted cookie name/value pairs
- Handles v10 prefix correctly (strips 3-byte prefix before AES-CBC)
- Copies cookie DB to temp location and cleans up
- Gracefully degrades when Keychain is inaccessible (returns `<encrypted>` placeholder)
- All tests pass
