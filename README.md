# Browser Automation Scripts (bas)

Chrome profile launcher, cookie decryption, and CLI for browser automation on macOS.

## Requirements

- macOS
- Node.js >= 18
- Google Chrome installed

## Installation

```bash
npm install
npm run build
npm link  # makes 'bas' available globally
```

## CLI Usage

### List Chrome profiles

```bash
bas profiles
```

### Decrypt cookies for a domain

```bash
# Table format (default)
bas cookies rippling.com

# JSON format
bas cookies rippling.com --format json

# Specify profile
bas cookies rippling.com --profile "Profile 1"
```

### Launch Chrome with a profile

```bash
bas launch Default
bas launch "Profile 1" --url https://example.com
```

## Library Usage

```typescript
import { getCookies, listProfiles, launchProfile } from 'browser-automation-scripts';

// List all Chrome profiles
const profiles = listProfiles();
console.log(profiles);

// Get decrypted cookies for a domain
const cookies = getCookies('example.com');
console.log(cookies);

// Launch Chrome with a profile
launchProfile('Default', { url: 'https://example.com' });
```

## API

### `listProfiles(): ChromeProfile[]`

Returns an array of Chrome profiles found on the system.

### `getCookies(domain: string, profileDir?: string): Cookie[]`

Decrypts and returns cookies matching the given domain. Uses macOS Keychain for the Chrome Safe Storage password.

### `launchProfile(profileDir: string, options?: LaunchOptions): number`

Opens Chrome with the specified profile. Returns the spawned process PID.
