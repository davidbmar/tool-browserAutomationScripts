import { getCookies, listProfiles, launchProfile } from '../src';
import type { Cookie, ChromeProfile, LaunchOptions } from '../src';

describe('Public API exports', () => {
  test('getCookies is exported and is a function', () => {
    expect(typeof getCookies).toBe('function');
  });

  test('listProfiles is exported and is a function', () => {
    expect(typeof listProfiles).toBe('function');
  });

  test('launchProfile is exported and is a function', () => {
    expect(typeof launchProfile).toBe('function');
  });
});

describe('listProfiles', () => {
  test('returns an array', () => {
    const profiles = listProfiles();
    expect(Array.isArray(profiles)).toBe(true);
  });

  test('each profile has required fields', () => {
    const profiles = listProfiles();
    for (const profile of profiles) {
      expect(profile).toHaveProperty('directory');
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('path');
      expect(typeof profile.directory).toBe('string');
      expect(typeof profile.name).toBe('string');
      expect(typeof profile.path).toBe('string');
    }
  });

  test('Default profile appears first if it exists', () => {
    const profiles = listProfiles();
    if (profiles.length > 0) {
      // If Default profile exists, it should be first
      const hasDefault = profiles.some(p => p.directory === 'Default');
      if (hasDefault) {
        expect(profiles[0].directory).toBe('Default');
      }
    }
  });
});

describe('Type exports', () => {
  test('Cookie type is usable', () => {
    const cookie: Cookie = {
      name: 'test',
      value: 'value',
      domain: '.example.com',
      path: '/',
      expires: 0,
      httpOnly: false,
      secure: true,
    };
    expect(cookie.name).toBe('test');
  });

  test('ChromeProfile type is usable', () => {
    const profile: ChromeProfile = {
      directory: 'Default',
      name: 'Test User',
      path: '/tmp/test',
    };
    expect(profile.directory).toBe('Default');
  });

  test('LaunchOptions type is usable', () => {
    const opts: LaunchOptions = { url: 'https://example.com' };
    expect(opts.url).toBe('https://example.com');
  });
});
