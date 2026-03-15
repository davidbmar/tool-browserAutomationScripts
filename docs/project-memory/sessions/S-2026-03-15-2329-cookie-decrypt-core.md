# Session

Session-ID: S-2026-03-15-2329-cookie-decrypt-core
Title: Implement Chrome cookie decryption module for macOS
Date: 2026-03-15
Author: agentB

## Goal

Build Chrome cookie decryption module for macOS using native Node.js crypto — the core engine that retrieves encrypted cookies from Chrome's SQLite DB and decrypts them using the Keychain-stored Safe Storage key.

## Context

Sprint 1 task for agentB. No existing code — greenfield implementation. macOS-only, no browser_cookie3, no Puppeteer/Playwright. Must be designed as a library with a clean public API.

## Plan

1. Initialize TypeScript project with better-sqlite3 and vitest
2. Implement decrypt-macos.ts (Keychain access, PBKDF2 key derivation, AES-128-CBC decryption)
3. Implement db.ts (cookie DB path resolution, temp-copy-and-read pattern)
4. Implement index.ts (public getCookies API combining db + decryption)
5. Create fixture DB generator and comprehensive tests
6. Verify all tests pass

## Changes Made

- `package.json` — project init with better-sqlite3, typescript, vitest
- `tsconfig.json` — TypeScript configuration
- `vitest.config.ts` — test runner configuration
- `src/core/cookies/decrypt-macos.ts` — Keychain access, PBKDF2 key derivation, AES-128-CBC v10 decryption
- `src/core/cookies/db.ts` — Chrome cookie DB path resolution, temp-copy read with WAL support
- `src/core/cookies/index.ts` — Public getCookies() API, re-exports
- `tests/create-fixture.ts` — Deterministic fixture DB generator with known encrypted values
- `tests/cookies.test.ts` — 17 tests covering decryption, DB read, public API, graceful degradation

## Decisions Made

- Used `execFileSync` instead of `execSync` for Keychain access to prevent shell injection
- Chrome's v10 encryption uses a fixed IV of 16 space characters (0x20), not random — this is Chrome's actual behavior
- Copies cookie DB to temp dir before reading to avoid Chrome's WAL lock; also copies -wal/-shm files if present
- When Keychain is inaccessible, getCookies() returns `<encrypted>` placeholders instead of throwing
- Test fixture uses a known password so tests don't need Keychain access

## Open Questions

- None — all acceptance criteria met

## Links

Commits:
- (pending) Initial cookie decryption implementation
