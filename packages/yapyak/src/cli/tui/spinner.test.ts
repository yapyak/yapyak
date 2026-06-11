import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { spinner } from './spinner';

function setIsTTY(value: boolean | undefined): void {
  Object.assign(process.stdout, {
    isTTY: value,
  });
}

describe('spinner', () => {
  let writes: string[];
  let originalIsTty: boolean | undefined;
  let originalCi: string | undefined;
  let originalNoColor: string | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
    originalIsTty = process.stdout.isTTY;
    originalCi = process.env.CI;
    originalNoColor = process.env.NO_COLOR;
    setIsTTY(true);
    delete process.env.CI;
    delete process.env.NO_COLOR;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setIsTTY(originalIsTty);
    if (originalCi === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = originalCi;
    }
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  it('writes the initial frame on creation', () => {
    spinner('Loading...');
    expect(writes.join('')).toContain('Loading...');
  });

  it('writes a check mark on `succeed` and stops the interval', () => {
    const instance = spinner('Save');
    instance.succeed('Save changes');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).toContain('Save changes');
    expect(final.match(/Save changes/g)).toHaveLength(1);
  });

  it('writes a cross on `fail` and stops the interval', () => {
    const instance = spinner('Save');
    instance.fail('Cancel');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).toContain('Cancel');
    expect(final.match(/Cancel/g)).toHaveLength(1);
  });

  it('picks up the new message on the next frame after `update`', () => {
    const instance = spinner('Loading...');
    instance.update('Switch account');
    vi.advanceTimersByTime(80);
    expect(writes.join('')).toContain('Switch account');
    instance.succeed('Settings');
  });

  it('writes plain output without escape sequences when stdout is not a TTY', () => {
    setIsTTY(undefined);
    const instance = spinner('Loading...');
    instance.succeed('Settings');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).not.toContain('\x1b[K');
    expect(final).toContain('Loading...');
    expect(final).toContain('Settings');
  });

  it('writes plain output without escape sequences when `CI` is set', () => {
    process.env.CI = 'true';
    const instance = spinner('Loading...');
    instance.fail('Cancel');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).not.toContain('\x1b[K');
    expect(final).toContain('Cancel');
  });

  it('writes plain output without escape sequences when `NO_COLOR` is set', () => {
    process.env.NO_COLOR = '1';
    const instance = spinner('Loading...');
    instance.succeed('Settings');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).not.toContain('\x1b[K');
    expect(final).toContain('Settings');
  });
});
