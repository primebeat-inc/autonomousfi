import { describe, it, expect } from 'vitest';
import { SDK_VERSION } from '../src/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_JSON = JSON.parse(
  readFileSync(resolve(__dirname, '../package.json'), 'utf-8')
) as { version: string };

describe('SDK_VERSION', () => {
  it('matches the version declared in package.json', () => {
    expect(SDK_VERSION).toBe(PKG_JSON.version);
  });

  it('is a valid semver triple', () => {
    expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  });
});
