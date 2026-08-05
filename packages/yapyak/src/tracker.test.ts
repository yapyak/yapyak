import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { autoRegisterTracker, registerTracker, runTrackers } from './tracker';
import { resetWarn, setWarn } from './warn';

function makeMeta(
  hot?:
    | {
        dispose(callback: () => void): void;
      }
    | undefined,
): ImportMeta {
  return {
    ...import.meta,
    hot,
  };
}

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

    autoRegisterTracker(
      makeMeta({
        dispose,
      }),
      tracker,
    );

    expect(dispose).toHaveBeenCalledOnce();
    const unregister = dispose.mock.calls[0]?.[0];
    expect(unregister).toBeTypeOf('function');
    unregister?.();
    runTrackers();
    expect(tracker).not.toHaveBeenCalled();
  });
});

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

describe('runTrackers', () => {
  let warnSpy: ReturnType<
    typeof vi.fn<(message: string, meta?: Record<string, unknown>) => void>
  >;

  beforeEach(() => {
    warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
  });

  afterEach(() => {
    resetWarn();
  });

  it('warns when a tracker throws', () => {
    const cause = new Error('boom');
    const unregister = registerTracker(() => {
      throw cause;
    });

    runTrackers();

    expect(warnSpy).toHaveBeenCalledOnce();
    unregister();
  });

  it('notifies every remaining tracker when a prior tracker throws', () => {
    const second = vi.fn();
    const third = vi.fn();
    const unregisterFirst = registerTracker(() => {
      throw new Error('boom');
    });
    const unregisterSecond = registerTracker(second);
    const unregisterThird = registerTracker(third);

    runTrackers();

    expect(second).toHaveBeenCalledOnce();
    expect(third).toHaveBeenCalledOnce();
    unregisterFirst();
    unregisterSecond();
    unregisterThird();
  });
});
