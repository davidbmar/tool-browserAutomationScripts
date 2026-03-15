agentA-chrome-launcher — Sprint 1

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
- Build Chrome profile discovery and launch module

Tasks
- Create `src/core/config.ts` with Chrome paths per-platform (macOS default, extensible)
- Create `src/core/launcher/paths.ts` with `getChromePath()` and `getUserDataDir()` for macOS
- Create `src/core/launcher/index.ts` with `listProfiles()` returning profile names and `launchProfile(name)` spawning Chrome
- Add `tsconfig.json` and `package.json` with TypeScript, `better-sqlite3`, build scripts
- Add tests in `tests/launcher.test.ts` for profile discovery and path resolution

Acceptance Criteria
- `listProfiles()` returns array of Chrome profile names found on disk
- `launchProfile('Default')` spawns Chrome with the correct `--user-data-dir` and `--profile-directory`
- Config module correctly resolves macOS Chrome paths
- All tests pass
