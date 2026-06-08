import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { spinner } from './spinner';

describe('spinner', () => {
  let writes: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk));
      return true;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('writes the initial frame on creation', () => {
    spinner('Loading...');
    expect(writes.join('')).toContain('Loading...');
  });

  it('writes a check mark on `succeed` and stops the interval', () => {
    const sp = spinner('Save');
    sp.succeed('Save changes');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).toContain('Save changes');
    expect(final.match(/Save changes/g)).toHaveLength(1);
  });

  it('writes a cross on `fail` and stops the interval', () => {
    const sp = spinner('Save');
    sp.fail('Cancel');
    vi.advanceTimersByTime(1000);
    const final = writes.join('');
    expect(final).toContain('Cancel');
    expect(final.match(/Cancel/g)).toHaveLength(1);
  });

  it('picks up the new message on the next frame after `update`', () => {
    const sp = spinner('Loading...');
    sp.update('Switch account');
    vi.advanceTimersByTime(80);
    expect(writes.join('')).toContain('Switch account');
    sp.succeed('Settings');
  });
});
