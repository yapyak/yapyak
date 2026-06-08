import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { run } from './run';

describe('run', () => {
  let writes: string[];

  beforeEach(() => {
    writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns `0` and prints help when no command is given', async () => {
    const code = await run([]);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('yapyak');
    expect(writes.join('')).toContain('Commands');
  });

  it('returns `0` and prints help when `--help` is given', async () => {
    const code = await run(['--help']);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('Commands');
  });

  it('returns `0` and prints the version when `--version` is given', async () => {
    const code = await run(['--version']);
    expect(code).toBe(0);
    expect(writes.join('')).toContain('yapyak ');
  });

  it('returns `1` and warns about an unknown command', async () => {
    const code = await run(['bogus']);
    expect(code).toBe(1);
    expect(writes.join('')).toContain('Unknown command: bogus');
  });
});
