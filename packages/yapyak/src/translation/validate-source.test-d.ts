import type { ValidateSource } from './validate-source';

import { describe, expectTypeOf, it } from 'vitest';

describe('ValidateSource', () => {
  it('preserves a valid source literal unchanged', () => {
    expectTypeOf<
      ValidateSource<'Save changes'>
    >().toEqualTypeOf<'Save changes'>();
  });

  it('preserves a source with valid simple placeholders', () => {
    expectTypeOf<
      ValidateSource<'Hello, {name}!'>
    >().toEqualTypeOf<'Hello, {name}!'>();
  });

  it('preserves a generic `string` source unchanged', () => {
    expectTypeOf<ValidateSource<string>>().toEqualTypeOf<string>();
  });

  it('refuses an empty source literal', () => {
    expectTypeOf<ValidateSource<''>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid source: must not be an empty string';
    }>();
  });

  it('refuses a digit-first placeholder name', () => {
    expectTypeOf<ValidateSource<'Item {0}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "0": must start with a letter or underscore (not a digit)';
    }>();
  });

  it('refuses a dotted placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {user.name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "user.name": cannot contain spaces, dots, or other punctuation';
    }>();
  });

  it('refuses a spaced placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {first name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "first name": cannot contain spaces, dots, or other punctuation';
    }>();
  });

  it('refuses an empty placeholder name', () => {
    expectTypeOf<ValidateSource<'Hello {}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "": name cannot be empty';
    }>();
  });

  it('preserves a valid plural placeholder', () => {
    expectTypeOf<
      ValidateSource<'You have {count, plural, one {# msg} other {# msgs}}'>
    >().toEqualTypeOf<'You have {count, plural, one {# msg} other {# msgs}}'>();
  });

  it('refuses a plural placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{count, plural, one {# msg} two {# msgs}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: `Plural "{count}" is missing the required 'other' branch`;
    }>();
  });

  it('refuses a selectordinal placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{n, selectordinal, one {1st} two {2nd}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: `Selectordinal "{n}" is missing the required 'other' branch`;
    }>();
  });

  it('refuses a select placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{theme, select, dark {Dark} light {Light}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: `Select "{theme}" is missing the required 'other' branch`;
    }>();
  });

  it('refuses an unknown ICU format keyword', () => {
    expectTypeOf<
      ValidateSource<'{x, plurral, one {a} other {b}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown ICU format "plurral" — expected one of: plural, selectordinal, select, number, date, time';
    }>();
  });

  it('preserves a valid bare ICU format placeholder', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number}'>
    >().toEqualTypeOf<'Price: {amount, number}'>();
  });

  it('preserves a valid number style', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, percent}'>
    >().toEqualTypeOf<'Price: {amount, number, percent}'>();
  });

  it('preserves a valid date style', () => {
    expectTypeOf<
      ValidateSource<'Updated: {when, date, short}'>
    >().toEqualTypeOf<'Updated: {when, date, short}'>();
  });

  it('preserves a valid time style', () => {
    expectTypeOf<
      ValidateSource<'At: {when, time, full}'>
    >().toEqualTypeOf<'At: {when, time, full}'>();
  });

  it('preserves a number skeleton style starting with `::`', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, ::compact-short}'>
    >().toEqualTypeOf<'Price: {amount, number, ::compact-short}'>();
  });

  it('refuses an unknown number style', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, foo}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown number style "foo" — expected one of: decimal, percent, currency, integer';
    }>();
  });

  it('refuses an unknown date style', () => {
    expectTypeOf<
      ValidateSource<'Updated: {when, date, banana}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown date style "banana" — expected one of: short, medium, long, full';
    }>();
  });

  it('refuses an unknown time style', () => {
    expectTypeOf<ValidateSource<'At: {when, time, weird}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown time style "weird" — expected one of: short, medium, long, full';
    }>();
  });

  it('preserves a plural with a valid `=N` literal branch', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, =0 {none} one {# msg} other {# msgs}}'>
    >().toEqualTypeOf<'{c, plural, =0 {none} one {# msg} other {# msgs}}'>();
  });

  it('refuses an unknown plural keyword', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, ones {# msg} other {# msgs}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown plural keyword "ones" — expected one of: zero, one, two, few, many, other, or =N literal';
    }>();
  });

  it('refuses an unknown plural keyword in a non-first branch', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, one {# msg} mny {# msgs} other {# many msgs}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown plural keyword "mny" — expected one of: zero, one, two, few, many, other, or =N literal';
    }>();
  });

  it('refuses an unknown selectordinal keyword', () => {
    expectTypeOf<
      ValidateSource<'{n, selectordinal, frst {1st} other {Nth}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown selectordinal keyword "frst" — expected one of: zero, one, two, few, many, other, or =N literal';
    }>();
  });

  it('skips plural keyword validation when a branch contains a nested placeholder', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, one {Have {item} now} other {Have {items} now}}'>
    >().toEqualTypeOf<'{c, plural, one {Have {item} now} other {Have {items} now}}'>();
  });

  it('holds the first error when a source has multiple violations', () => {
    expectTypeOf<ValidateSource<'Hi {0}, {user.name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "0": must start with a letter or underscore (not a digit)';
    }>();
  });
});
