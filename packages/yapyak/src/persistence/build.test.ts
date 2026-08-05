import { describe, expect, it } from 'vitest';

import { buildPersistence } from './build';

describe('buildPersistence', () => {
  it('builds `cookie` persistence', () => {
    const persistence = buildPersistence({
      name: 'locale',
      secure: false,
      type: 'cookie',
    });
    expect(persistence).toBeDefined();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds `localStorage` persistence', () => {
    const persistence = buildPersistence({
      key: 'locale',
      type: 'local-storage',
    });
    expect(persistence).toBeDefined();
    expect(persistence?.getFromRequest).toBeUndefined();
  });

  it('builds `url` persistence with default pattern', () => {
    const persistence = buildPersistence({
      type: 'url',
    });
    expect(persistence).toBeDefined();
    expect(persistence?.getFromRequest).toBeDefined();
  });

  it('builds `url` persistence with a custom `RegExp`', () => {
    const persistence = buildPersistence({
      match: /\/(en|sv)\//,
      type: 'url',
    });
    expect(persistence).toBeDefined();
  });

  it('returns `undefined` when config type is `none`', () => {
    expect(
      buildPersistence({
        type: 'none',
      }),
    ).toBeUndefined();
  });
});
