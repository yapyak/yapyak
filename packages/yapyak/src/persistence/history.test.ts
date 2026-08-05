// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { subscribeHistory } from './history';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribeHistory', () => {
  it('notifies the callback on `popstate`', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onChange).toHaveBeenCalled();
    teardown();
  });

  it('notifies the callback on `pushState`', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    window.history.pushState({}, '', '/en');
    expect(onChange).toHaveBeenCalled();
    teardown();
  });

  it('notifies the callback on `replaceState`', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    window.history.replaceState({}, '', '/sv');
    expect(onChange).toHaveBeenCalled();
    teardown();
  });

  it('blocks notification on `popstate` after teardown', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    teardown();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('blocks notification on `pushState` after teardown', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    teardown();
    window.history.pushState({}, '', '/en');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('blocks notification on `replaceState` after teardown', () => {
    const onChange = vi.fn();
    const teardown = subscribeHistory(onChange);
    teardown();
    window.history.replaceState({}, '', '/sv');
    expect(onChange).not.toHaveBeenCalled();
  });
});
