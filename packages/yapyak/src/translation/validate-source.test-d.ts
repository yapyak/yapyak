import type {
  ContextSeparatorError,
  EmptySourceError,
  InvalidPlaceholderError,
  MissingOtherBranchError,
  UnknownIcuFormatError,
} from './type-error';
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
    expectTypeOf<ValidateSource<''>>().toEqualTypeOf<EmptySourceError>();
  });

  it('refuses a digit-first placeholder name', () => {
    expectTypeOf<ValidateSource<'Item {0}'>>().toEqualTypeOf<
      InvalidPlaceholderError<
        '0',
        'must start with a letter or underscore (not a digit)'
      >
    >();
  });

  it('refuses a dotted placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {user.name}'>>().toEqualTypeOf<
      InvalidPlaceholderError<
        'user.name',
        'cannot contain spaces, dots, or other punctuation'
      >
    >();
  });

  it('refuses a spaced placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {first name}'>>().toEqualTypeOf<
      InvalidPlaceholderError<
        'first name',
        'cannot contain spaces, dots, or other punctuation'
      >
    >();
  });

  it('refuses an empty placeholder name', () => {
    expectTypeOf<ValidateSource<'Hello {}'>>().toEqualTypeOf<
      InvalidPlaceholderError<'', 'name cannot be empty'>
    >();
  });

  it('preserves a valid plural placeholder', () => {
    expectTypeOf<
      ValidateSource<'You have {count, plural, one {# msg} other {# msgs}}'>
    >().toEqualTypeOf<'You have {count, plural, one {# msg} other {# msgs}}'>();
  });

  it('refuses a plural placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{count, plural, one {# msg} two {# msgs}}'>
    >().toEqualTypeOf<MissingOtherBranchError<'count', 'Plural'>>();
  });

  it('refuses a selectordinal placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{n, selectordinal, one {1st} two {2nd}}'>
    >().toEqualTypeOf<MissingOtherBranchError<'n', 'Selectordinal'>>();
  });

  it('refuses a select placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{theme, select, dark {Dark} light {Light}}'>
    >().toEqualTypeOf<MissingOtherBranchError<'theme', 'Select'>>();
  });

  it('refuses an unknown ICU format keyword', () => {
    expectTypeOf<
      ValidateSource<'{x, plurral, one {a} other {b}}'>
    >().toEqualTypeOf<UnknownIcuFormatError<'plurral'>>();
  });

  it('preserves a valid bare ICU format placeholder', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number}'>
    >().toEqualTypeOf<'Price: {amount, number}'>();
  });

  it('holds the first error when a source has multiple violations', () => {
    expectTypeOf<ValidateSource<'Hi {0}, {user.name}'>>().toEqualTypeOf<
      InvalidPlaceholderError<
        '0',
        'must start with a letter or underscore (not a digit)'
      >
    >();
  });
});

describe('ContextSeparatorError', () => {
  it('holds the offending context in the message body', () => {
    expectTypeOf<
      ContextSeparatorError<'btn@x'>
    >().toEqualTypeOf<`Invalid context "btn@x": '@' is reserved as the source/context separator`>();
  });
});
