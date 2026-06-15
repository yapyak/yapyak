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
      code: 'UNKNOWN_CODE',
    });

    expect(stub).toHaveBeenCalledWith('Hello', {
      code: 'UNKNOWN_CODE',
    });
  });

  it('writes the prefixed message to `console.warn` via the default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello');

    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello');
  });

  it('writes the prefixed message and `meta` to `console.warn` via the default', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello', {
      code: 'UNKNOWN_CODE',
    });

    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello', {
      code: 'UNKNOWN_CODE',
    });
  });

  it('blocks emission when `process.env.NODE_ENV` is `production`', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warn('Hello');

    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('blocks emission when `process.env.NODE_ENV` is `test`', () => {
    vi.stubEnv('NODE_ENV', 'test');
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
    vi.stubEnv('NODE_ENV', 'development');
    const stub = vi.fn();
    setWarn(stub);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    resetWarn();
    warn('Hello');

    expect(stub).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledWith('[yapyak] Hello');
  });
});
