import { describe, expect, it } from 'vitest';

import { createPersistence } from './create';

describe('createPersistence', () => {
  it('returns `true` from set when underlying set returns `true`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => true,
    });
    expect(persistence.set('sv')).toBe(true);
  });

  it('returns `false` from set when underlying set returns `false`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => false,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('returns `false` from set when underlying set returns `undefined`', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.set('sv')).toBe(false);
  });

  it('returns `undefined` for `getFromRequest` when not provided', () => {
    const persistence = createPersistence({
      get: () => undefined,
      set: () => undefined,
    });
    expect(persistence.getFromRequest).toBeUndefined();
  });
});
