import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runYapyakCommand } from './yapyak-command';

describe('runYapyakCommand', () => {
  let originalUserAgent: string | undefined;

  beforeEach(() => {
    originalUserAgent = process.env.npm_config_user_agent;
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('returns a `pnpm yapyak` invocation when the user agent starts with `pnpm/`', () => {
    process.env.npm_config_user_agent = 'pnpm/9.0.0 npm/? node/v22.0.0';
    expect(runYapyakCommand('add sv')).toBe('pnpm yapyak add sv');
  });

  it('returns a `yarn yapyak` invocation when the user agent starts with `yarn/`', () => {
    process.env.npm_config_user_agent = 'yarn/4.0.0 npm/? node/v22.0.0';
    expect(runYapyakCommand('translate')).toBe('yarn yapyak translate');
  });

  it('returns a `bunx yapyak` invocation when the user agent starts with `bun/`', () => {
    process.env.npm_config_user_agent = 'bun/1.0.0 npm/? node/v22.0.0';
    expect(runYapyakCommand('check')).toBe('bunx yapyak check');
  });

  it('returns an `npx yapyak` invocation when the user agent is undefined', () => {
    delete process.env.npm_config_user_agent;
    expect(runYapyakCommand('status')).toBe('npx yapyak status');
  });

  it('returns an `npx yapyak` invocation for an unknown user agent', () => {
    process.env.npm_config_user_agent = 'npm/10.0.0 node/v22.0.0';
    expect(runYapyakCommand('status')).toBe('npx yapyak status');
  });
});
