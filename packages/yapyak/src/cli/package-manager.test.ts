import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolvePackageManager, resolveRunCommand } from './package-manager';

describe('resolvePackageManager', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the name and version from the user agent', () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/10.33.0 npm/? node/v22.22.1');

    expect(resolvePackageManager()).toBe('pnpm 10.33.0');
  });

  it('returns `unknown` when no user agent is present', () => {
    vi.stubEnv('npm_config_user_agent', undefined);

    expect(resolvePackageManager()).toBe('unknown');
  });
});

describe('resolveRunCommand', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the bare form for `pnpm`', () => {
    vi.stubEnv('npm_config_user_agent', 'pnpm/10.33.0 npm/? node/v22.22.1');

    expect(resolveRunCommand('dev')).toBe('pnpm dev');
  });

  it('returns the `npm run` form for `npm`', () => {
    vi.stubEnv('npm_config_user_agent', 'npm/10.9.4 node/v22.22.1');

    expect(resolveRunCommand('dev')).toBe('npm run dev');
  });
});
