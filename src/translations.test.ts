import { describe, expect, it } from 'vitest';
import { defineTranslations } from './translations.js';

describe('defineTranslations', () => {
  it('returns plain string for keys without placeholders', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
    });
    expect(t.cta).toBe('Open inbox');
  });

  it('returns interpolating function for keys with placeholders', () => {
    const t = defineTranslations({
      greeting: 'Hello {name}',
    });
    expect(t.greeting({ name: 'Joakim' })).toBe('Hello Joakim');
  });

  it('returns empty string for missing param', () => {
    const t = defineTranslations({
      greeting: 'Hello {name}',
    });
    expect(t.greeting({} as { name: string })).toBe('Hello ');
  });

  it('handles multiple placeholders', () => {
    const t = defineTranslations({
      message: 'Hello {name}, you are {role}',
    });
    expect(t.message({ name: 'Joakim', role: 'admin' })).toBe(
      'Hello Joakim, you are admin',
    );
  });

  it('handles plural placeholders', () => {
    const t = defineTranslations({
      items:
        'You have {count, plural, one {# item} other {# items}}',
    });
    expect(t.items({ count: 1 })).toBe('You have 1 item');
    expect(t.items({ count: 5 })).toBe('You have 5 items');
  });

  it('handles plural with exact match', () => {
    const t = defineTranslations({
      items:
        'You have {count, plural, =0 {nothing} one {# item} other {# items}}',
    });
    expect(t.items({ count: 0 })).toBe('You have nothing');
    expect(t.items({ count: 1 })).toBe('You have 1 item');
    expect(t.items({ count: 7 })).toBe('You have 7 items');
  });

  it('handles select placeholders', () => {
    const t = defineTranslations({
      greeting:
        '{name, select, joakim {Hej Joakim} other {Hello {name}}}',
    });
    expect(t.greeting({ name: 'joakim' })).toBe('Hej Joakim');
    expect(t.greeting({ name: 'maria' })).toBe('Hello maria');
  });

  it('handles nested schemas', () => {
    const t = defineTranslations({
      buttons: {
        save: 'Save',
        cancel: 'Cancel',
      },
      errors: {
        notFound: 'Not found',
        generic: 'Failed: {reason}',
      },
    });
    expect(t.buttons.save).toBe('Save');
    expect(t.buttons.cancel).toBe('Cancel');
    expect(t.errors.notFound).toBe('Not found');
    expect(t.errors.generic({ reason: 'timeout' })).toBe('Failed: timeout');
  });

  it('exposes .in() that returns a translations proxy', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
    });
    expect(t.in('sv').cta).toBe('Open inbox');
  });

  it('.in() chains', () => {
    const t = defineTranslations({
      greeting: 'Hello {name}',
    });
    expect(t.in('sv').in('fr').greeting({ name: 'Joakim' })).toBe(
      'Hello Joakim',
    );
  });

  it('.in() works on nested keys', () => {
    const t = defineTranslations({
      buttons: {
        save: 'Save',
      },
    });
    expect(t.in('sv').buttons.save).toBe('Save');
  });

  it('returns undefined for unknown keys', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
    }) as unknown as Record<string, unknown>;
    expect(t.unknown).toBeUndefined();
  });

  it('supports Object.keys to introspect schema', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
      greeting: 'Hello {name}',
    });
    const keys = Object.keys(t).sort();
    expect(keys).toEqual(['cta', 'greeting', 'in']);
  });
});
