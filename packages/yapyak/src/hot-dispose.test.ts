import { describe, expect, it, vi } from 'vitest';

import { registerHotDispose } from './hot-dispose';

function makeMeta(
  hot?: { dispose(callback: () => void): void } | undefined,
): ImportMeta {
  return { ...import.meta, hot };
}

describe('registerHotDispose', () => {
  it('notifies meta.hot.dispose with the callback', () => {
    const dispose = vi.fn();
    const cleanup = (): void => {};

    registerHotDispose(makeMeta({ dispose }), cleanup);

    expect(dispose).toHaveBeenCalledWith(cleanup);
  });

  it('blocks when meta.hot is undefined', () => {
    const cleanup = vi.fn();

    registerHotDispose(makeMeta(undefined), cleanup);

    expect(cleanup).not.toHaveBeenCalled();
  });
});
