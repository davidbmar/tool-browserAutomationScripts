# Session

Session-ID: S-2026-03-15-2325-chrome-launcher-core
Title: Chrome profile launcher core module
Date: 2026-03-15
Author: agentA

## Goal

Build Chrome profile discovery and launch module — the core engine for Sprint 1.

## Context

Sprint 1 kickoff. This agent is responsible for Chrome profile discovery and launching. No prior code exists; scaffolding only.

## Plan

1. Create project config (package.json, tsconfig.json)
2. Create `src/core/config.ts` — platform-specific Chrome paths
3. Create `src/core/launcher/paths.ts` — path resolution helpers
4. Create `src/core/launcher/index.ts` — listProfiles() and launchProfile()
5. Create tests with mocked fs/child_process

## Changes Made

- `package.json` — project config with TypeScript, vitest, better-sqlite3 (optional)
- `tsconfig.json` — strict TypeScript config targeting ES2022
- `src/core/config.ts` — platform paths registry (macOS default, extensible)
- `src/core/launcher/paths.ts` — getChromePath(), getUserDataDir(), chromeExists()
- `src/core/launcher/index.ts` — listProfiles() scans Chrome user data dir, launchProfile() spawns Chrome with correct flags
- `tests/launcher.test.ts` — 11 tests covering config, paths, profile discovery, and launch

## Decisions Made

- **better-sqlite3 as optionalDependency**: Native compilation fails on Node 25.x. Since it's needed for cookie decryption (not this agent's scope), moved to optional so launcher module works independently.
- **Profile detection via Preferences file**: Only directories containing a `Preferences` JSON file are treated as valid Chrome profiles, filtering out non-profile dirs like `Crashpad`.
- **Display name from prefs**: Profile names are read from `profile.name` in Preferences, falling back to directory name if unreadable.
- **Detached spawn**: launchProfile() spawns Chrome detached and unref'd so the Node process doesn't block.

## Open Questions

- Linux/Windows path support — deferred to future sprint
- better-sqlite3 build fix needed for Node 25.x compatibility

## Links

Commits:
- (pending)
