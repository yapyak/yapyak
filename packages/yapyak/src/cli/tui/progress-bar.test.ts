import { describe, expect, it } from 'vitest';

import { progressBar } from './progress-bar';

describe('progressBar', () => {
  it('builds a half-filled bar at midpoint', () => {
    const bar = progressBar(5, 10, 10);
    expect(bar).toContain('5/10');
    expect((bar.match(/█/g) ?? []).length).toBe(5);
    expect((bar.match(/░/g) ?? []).length).toBe(5);
  });

  it('builds an empty bar at zero progress', () => {
    const bar = progressBar(0, 10, 10);
    expect(bar).toContain('0/10');
    expect((bar.match(/░/g) ?? []).length).toBe(10);
  });

  it('builds a full bar at complete progress', () => {
    const bar = progressBar(10, 10, 10);
    expect(bar).toContain('10/10');
    expect((bar.match(/█/g) ?? []).length).toBe(10);
  });

  it('builds an empty bar when the total is zero', () => {
    const bar = progressBar(0, 0, 10);
    expect(bar).toContain('0/0');
    expect((bar.match(/░/g) ?? []).length).toBe(10);
  });
});
