# Session

Session-ID: S-2026-03-15-2328-cli-integration
Title: CLI integration — wire core modules into Commander.js CLI and library exports
Date: 2026-03-15
Author: agentC

## Goal

Wire Chrome profile listing, cookie decryption, and profile launching into a Commander.js CLI (`bas`) and a clean library API (`src/index.ts`).

## Context

Sprint 1 parallel work. AgentA builds chrome-launcher, agentB builds cookie-decrypt, agentC (this) builds the CLI integration layer. Starting from Afterburner scaffolding — no existing source code.

## Plan

1. Initialize Node.js project with TypeScript, Commander.js, better-sqlite3
2. Implement core modules: profiles, cookies, launcher
3. Create public API re-exports in src/index.ts
4. Build CLI with three commands: profiles, cookies, launch
5. Create bin/bas entry point
6. Write integration tests for public API surface
7. Create README with CLI and library usage docs

## Changes Made

- Created `package.json` with bin, main, exports fields
- Created `tsconfig.json` for TypeScript compilation
- Created `src/core/profiles.ts` — lists Chrome profiles from ~/Library/Application Support/Google/Chrome
- Created `src/core/cookies.ts` — decrypts Chrome cookies using macOS Keychain + PBKDF2 + AES-128-CBC
- Created `src/core/launcher.ts` — spawns Chrome with a specific profile directory
- Created `src/index.ts` — re-exports getCookies, listProfiles, launchProfile as public API
- Created `src/cli/bas.ts` — Commander.js CLI with profiles, cookies, launch commands
- Created `bin/bas` — CLI entry point (#!/usr/bin/env node)
- Created `tests/integration.test.ts` — 9 tests covering API exports, listProfiles behavior, type exports
- Created `README.md` — installation, CLI usage, library usage, API reference
- Created `.gitignore`

## Decisions Made

- Used `better-sqlite3` for synchronous SQLite access (Chrome Cookies DB) — simpler than async alternatives for a CLI tool
- Used `execFileSync` instead of `execSync` for Keychain access — avoids shell injection per project security hooks
- Cookie decryption implemented from scratch using Node.js native crypto (PBKDF2 + AES-128-CBC) per brief constraints
- Tests focus on API surface and listProfiles (works without Keychain access) rather than cookie decryption (requires macOS Keychain prompt)

## Open Questions

- How will agentA/agentB modules merge with these core modules? May need deduplication in sprint merge.
- Cookie decryption tests need Keychain access — consider CI strategy for testing.

## Links

Commits:
- (pending commit)

PRs:
- (none yet)

ADRs:
- (none)
