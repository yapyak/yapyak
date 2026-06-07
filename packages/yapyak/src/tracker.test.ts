import { describe, expect, it, vi } from 'vitest';

import { autoRegisterTracker, registerTracker, runTrackers } from './tracker';

function makeMeta(
  hot?: { dispose(callback: () => void): void } | undefined,
): ImportMeta {
  return { ...import.meta, hot };
}

describe('registerTracker', () => {
  it('notifies the tracker on runTrackers', () => {
    const tracker = vi.fn();
    const unregister = registerTracker(tracker);

    runTrackers();

    expect(tracker).toHaveBeenCalledOnce();
    unregister();
  });

  it('clears the tracker after the returned unregister runs', () => {
    const tracker = vi.fn();
    const unregister = registerTracker(tracker);

    unregister();
    runTrackers();

    expect(tracker).not.toHaveBeenCalled();
  });
});

describe('autoRegisterTracker', () => {
  it('notifies the tracker on runTrackers', () => {
    const tracker = vi.fn();
    autoRegisterTracker(makeMeta(), tracker);

    runTrackers();

    expect(tracker).toHaveBeenCalledOnce();
  });

  it('notifies meta.hot.dispose with an unregister handle', () => {
    const dispose = vi.fn();
    const tracker = vi.fn();

    autoRegisterTracker(makeMeta({ dispose }), tracker);

    expect(dispose).toHaveBeenCalledOnce();
    const unregister = dispose.mock.calls[0]?.[0];
    expect(unregister).toBeTypeOf('function');
    unregister?.();
    runTrackers();
    expect(tracker).not.toHaveBeenCalled();
  });
});
