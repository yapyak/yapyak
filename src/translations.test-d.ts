import { describe, expectTypeOf, it } from 'vitest';
import { defineTranslations } from './translations.js';

describe('Translations<S> type inference', () => {
  it('plain strings without placeholders are typed as string', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
    });
    expectTypeOf(t.cta).toEqualTypeOf<string>();
  });

  it('strings with {name} placeholder are typed as functions', () => {
    const t = defineTranslations({
      greeting: 'Hello {name}',
    });
    expectTypeOf(t.greeting).toEqualTypeOf<
      (params: { name: string }) => string
    >();
  });

  it('strings with multiple placeholders are typed correctly', () => {
    const t = defineTranslations({
      message: 'Hello {name}, you are {role}',
    });
    expectTypeOf(t.message).toEqualTypeOf<
      (params: { name: string; role: string }) => string
    >();
  });

  it('plural placeholders are typed as number', () => {
    const t = defineTranslations({
      items:
        'You have {count, plural, one {# item} other {# items}}',
    });
    expectTypeOf(t.items).toEqualTypeOf<
      (params: { count: number }) => string
    >();
  });

  it('select placeholders are typed as string', () => {
    const t = defineTranslations({
      greeting:
        '{name, select, joakim {Hej Joakim} other {Hello {name}}}',
    });
    expectTypeOf(t.greeting).parameter(0).toEqualTypeOf<{ name: string }>();
  });

  it('number placeholders are typed as number', () => {
    const t = defineTranslations({
      price: 'Total: {amount, number, currency}',
    });
    expectTypeOf(t.price).toEqualTypeOf<
      (params: { amount: number }) => string
    >();
  });

  it('nested schemas produce nested types', () => {
    const t = defineTranslations({
      buttons: {
        save: 'Save',
        submit: 'Submit {form}',
      },
    });
    expectTypeOf(t.buttons.save).toEqualTypeOf<string>();
    expectTypeOf(t.buttons.submit).toEqualTypeOf<
      (params: { form: string }) => string
    >();
  });

  it('.in(locale) returns a translations proxy of the same shape', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
      greeting: 'Hello {name}',
    });
    expectTypeOf(t.in('sv').cta).toEqualTypeOf<string>();
    expectTypeOf(t.in('sv').greeting).toEqualTypeOf<
      (params: { name: string }) => string
    >();
  });

  it('.in() chains', () => {
    const t = defineTranslations({
      cta: 'Open inbox',
    });
    expectTypeOf(t.in('sv').in('fr').cta).toEqualTypeOf<string>();
  });
});
