agentC-cli-integration — Sprint 1

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
- Wire modules into CLI and library exports

Tasks
- Create `src/index.ts` re-exporting `getCookies`, `listProfiles`, `launchProfile` as public library API
- Create `src/cli/bas.ts` using Commander.js with three commands: `profiles` (list Chrome profiles), `cookies <domain>` (decrypt and display cookies with `--profile` and `--format json|table` options), `launch <profile>` (open Chrome with profile)
- Create `bin/bas` as CLI entry point
- Add `"bin"`, `"main"`, `"exports"` fields to `package.json`
- Add integration tests in `tests/integration.test.ts` testing the public API imports
- Create `README.md` with installation and usage for CLI and library

Acceptance Criteria
- `bas profiles` lists available Chrome profiles
- `bas cookies rippling.com` prints decrypted cookies in table format
- `bas cookies rippling.com --format json` outputs JSON
- `bas launch Default` opens Chrome with Default profile
- `import { getCookies, listProfiles } from './src'` works
- All tests pass
