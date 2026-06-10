import { afterEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn, warn } from './warn';

afterEach(() => {
  resetWarn();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('warn', () => {
  it('writes through the active function', () => {
    const stub = vi.fn();
    setWarn(stub);

    warn('Hello', {
      code: 'YPK_TEST',
    });

    expect(stub).toHaveBeenCalledWith('Hello', {
      code: 'YPK_TEST',
    });
  });

  it('writes the prefixed message to `console.warn` via the default', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello');

    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello');
  });

  it('writes the prefixed message and `meta` to `console.warn` via the default', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello', {
      code: 'YPK_TEST',
    });

    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello', {
      code: 'YPK_TEST',
    });
  });

  it('blocks emission when `process.env.NODE_ENV` is `production`', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello');

    expect(consoleWarn).not.toHaveBeenCalled();
  });
});

describe('setWarn', () => {
  it('writes through the configured function on the next `warn`', () => {
    const stub = vi.fn();
    setWarn(stub);

    warn('Hello');

    expect(stub).toHaveBeenCalledWith('Hello', undefined);
  });
});

describe('resetWarn', () => {
  it('writes through the default after a custom function was set', () => {
    const stub = vi.fn();
    setWarn(stub);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resetWarn();
    warn('Hello');

    expect(stub).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello');
  });
});
