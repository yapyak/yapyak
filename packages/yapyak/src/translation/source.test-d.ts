import type { ValidateSource } from './source';

import { describe, expectTypeOf, it } from 'vitest';

import { t } from './t';

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
      $yapyakTypeError: 'Invalid source: must not be an empty string.';
    }>();
  });

  it('refuses a digit-first placeholder name', () => {
    expectTypeOf<ValidateSource<'Item {0}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "0": must start with a letter or underscore (not a digit).';
    }>();
  });

  it('refuses a dotted placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {user.name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "user.name": cannot contain spaces, dots, or other punctuation.';
    }>();
  });

  it('refuses a spaced placeholder name', () => {
    expectTypeOf<ValidateSource<'Hi {first name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "first name": cannot contain spaces, dots, or other punctuation.';
    }>();
  });

  it('refuses an empty placeholder name', () => {
    expectTypeOf<ValidateSource<'Hello {}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "": name cannot be empty.';
    }>();
  });

  it('refuses a source with an unclosed `{`', () => {
    expectTypeOf<ValidateSource<'Hello {'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "Hello {": contains an unclosed '{'. Close it as a placeholder like "{name}" or remove the brace.`;
    }>();
  });

  it('refuses a source with an unclosed `{` after a valid placeholder', () => {
    expectTypeOf<ValidateSource<'Hi {name}, opens {'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "Hi {name}, opens {": contains an unclosed '{'. Close it as a placeholder like "{name}" or remove the brace.`;
    }>();
  });

  it('refuses a source with an unmatched `}`', () => {
    expectTypeOf<ValidateSource<'Hello }'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "Hello }": contains an unmatched '}'. Remove it or add a matching '{'.`;
    }>();
  });

  it('refuses a source with an unmatched `}` after a valid placeholder', () => {
    expectTypeOf<ValidateSource<'Hi {name}, }'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "Hi {name}, }": contains an unmatched '}'. Remove it or add a matching '{'.`;
    }>();
  });

  it('preserves a source with matching paired tags', () => {
    expectTypeOf<
      ValidateSource<'Read <link>terms</link>'>
    >().toEqualTypeOf<'Read <link>terms</link>'>();
  });

  it('preserves a source with nested matching tags', () => {
    expectTypeOf<
      ValidateSource<'<b><link>terms</link></b>'>
    >().toEqualTypeOf<'<b><link>terms</link></b>'>();
  });

  it('preserves a source with a self-closing void tag', () => {
    expectTypeOf<
      ValidateSource<'line<br/>break'>
    >().toEqualTypeOf<'line<br/>break'>();
  });

  it('preserves a source with an attributed tag and its matching close', () => {
    expectTypeOf<
      ValidateSource<'an <a href="x">html</a> link'>
    >().toEqualTypeOf<'an <a href="x">html</a> link'>();
  });

  it('refuses a source with an empty `<>` tag', () => {
    expectTypeOf<ValidateSource<'This example uses<> cool'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "This example uses<> cool": contains an empty tag. Provide a name like "<link>" or remove the brackets.`;
    }>();
  });

  it('refuses a source with an empty `</>` closing tag', () => {
    expectTypeOf<ValidateSource<'This example uses</> cool'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "This example uses</> cool": contains an empty tag. Provide a name like "<link>" or remove the brackets.`;
    }>();
  });

  it('refuses a source with an unclosed opening tag', () => {
    expectTypeOf<ValidateSource<'Read <link>terms'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "Read <link>terms": opening tag "<link>" has no closing tag. Add "</link>".`;
    }>();
  });

  it('refuses a source with a closing tag that has no opening', () => {
    expectTypeOf<ValidateSource<'terms</link>'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "terms</link>": closing tag "</link>" has no matching opening tag.`;
    }>();
  });

  it('refuses a source where the closing tag does not match the opening', () => {
    expectTypeOf<ValidateSource<'<link>terms</bold>'>>().toEqualTypeOf<{
      $yapyakTypeError: `Invalid source "<link>terms</bold>": closing tag "</bold>" does not match opening "<link>". Close the opening tag first.`;
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
      $yapyakTypeError: `Plural "{count}" is missing the required 'other' branch.`;
    }>();
  });

  it('refuses a selectordinal placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{n, selectordinal, one {1st} two {2nd}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: `Selectordinal "{n}" is missing the required 'other' branch.`;
    }>();
  });

  it('refuses a select placeholder missing the `other` branch', () => {
    expectTypeOf<
      ValidateSource<'{theme, select, dark {Dark} light {Light}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: `Select "{theme}" is missing the required 'other' branch.`;
    }>();
  });

  it('refuses an unknown ICU format keyword', () => {
    expectTypeOf<
      ValidateSource<'{x, plurral, one {a} other {b}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown ICU format "plurral". Expected one of: plural, selectordinal, select, number, date, time.';
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

  it('preserves a `currency <code>` number style', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, currency USD}'>
    >().toEqualTypeOf<'Price: {amount, number, currency USD}'>();
  });

  it('refuses an ICU number skeleton style (not supported at runtime)', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, ::compact-short}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown number style "::compact-short". Expected one of: decimal, percent, currency, integer (or "currency <code>").';
    }>();
  });

  it('refuses an unknown number style', () => {
    expectTypeOf<
      ValidateSource<'Price: {amount, number, foo}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown number style "foo". Expected one of: decimal, percent, currency, integer (or "currency <code>").';
    }>();
  });

  it('refuses an unknown date style', () => {
    expectTypeOf<
      ValidateSource<'Updated: {when, date, banana}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown date style "banana". Expected one of: short, medium, long, full.';
    }>();
  });

  it('refuses an unknown time style', () => {
    expectTypeOf<ValidateSource<'At: {when, time, weird}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown time style "weird". Expected one of: short, medium, long, full.';
    }>();
  });

  it('preserves a plural with a valid `=N` literal branch', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, =0 {none} one {# msg} other {# msgs}}'>
    >().toEqualTypeOf<'{c, plural, =0 {none} one {# msg} other {# msgs}}'>();
  });

  it('refuses a `=N` literal where N contains non-digit characters', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, =foo {x} other {y}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid =N literal "=foo": N must be a non-negative integer.';
    }>();
  });

  it('refuses a bare `=` with no N', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, = {x} other {y}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid =N literal "=": N must be a non-negative integer.';
    }>();
  });

  it('refuses an unknown plural keyword', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, ones {# msg} other {# msgs}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown plural keyword "ones". Expected one of: zero, one, two, few, many, other, or =N literal.';
    }>();
  });

  it('refuses an unknown plural keyword in a non-first branch', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, one {# msg} mny {# msgs} other {# many msgs}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown plural keyword "mny". Expected one of: zero, one, two, few, many, other, or =N literal.';
    }>();
  });

  it('refuses an unknown selectordinal keyword', () => {
    expectTypeOf<
      ValidateSource<'{n, selectordinal, frst {1st} other {Nth}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Unknown selectordinal keyword "frst". Expected one of: zero, one, two, few, many, other, or =N literal.';
    }>();
  });

  it('blocks plural keyword validation when a branch contains a nested placeholder', () => {
    expectTypeOf<
      ValidateSource<'{c, plural, one {Have {item} now} other {Have {items} now}}'>
    >().toEqualTypeOf<'{c, plural, one {Have {item} now} other {Have {items} now}}'>();
  });

  it('holds the first error when a source has multiple violations', () => {
    expectTypeOf<ValidateSource<'Hi {0}, {user.name}'>>().toEqualTypeOf<{
      $yapyakTypeError: 'Invalid placeholder "0": must start with a letter or underscore (not a digit).';
    }>();
  });

  it('returns a string at the call site for a plural source with a nested placeholder in each branch', () => {
    expectTypeOf(
      t('You have {count, plural, one {# by {author}} other {# by {author}}}', {
        author: 'Ada',
        count: 1,
      }),
    ).toEqualTypeOf<string>();
  });

  it('returns a string at the call site for a select source with a nested placeholder in each branch', () => {
    expectTypeOf(
      t('{theme, select, dark {Hi {name}} other {Bye {name}}}', {
        name: 'Ada',
        theme: 'dark',
      }),
    ).toEqualTypeOf<string>();
  });

  it('returns a string at the call site for a select source whose selector is a free-form string', () => {
    expectTypeOf(
      t('{theme, select, dark {Hi {name}} other {Bye {name}}}', {
        name: 'Ada',
        theme: 'custom-theme',
      }),
    ).toEqualTypeOf<string>();
  });

  it('refuses a plural source where the `other` branch is missing', () => {
    expectTypeOf<
      ValidateSource<'You have {count, plural, one {# item}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Plural "{count}" is missing the required \'other\' branch.';
    }>();
  });

  it('refuses a select source where the `other` branch is missing', () => {
    expectTypeOf<
      ValidateSource<'{gender, select, male {Mr.} female {Ms.}}'>
    >().toEqualTypeOf<{
      $yapyakTypeError: 'Select "{gender}" is missing the required \'other\' branch.';
    }>();
  });

  it('returns a string at the call site for a source with ten levels of nested ICU branches', () => {
    expectTypeOf(
      t(
        '{a, plural, one {{b, select, x {{c, plural, one {{d, select, y {{e, plural, one {{f, select, z {{g, plural, one {{h, select, w {{i, plural, one {{j, select, v {deep} other {q9}}} other {q8}}} other {q7}}} other {q6}}} other {q5}}} other {q4}}} other {q3}}} other {q2}}} other {q1}}} other {q0}}',
        {
          a: 1,
          b: 'x',
          c: 1,
          d: 'y',
          e: 1,
          f: 'z',
          g: 1,
          h: 'w',
          i: 1,
          j: 'v',
        },
      ),
    ).toEqualTypeOf<string>();
  });

  it('returns a string at the call site for a source with fifty simple placeholders', () => {
    expectTypeOf(
      t(
        '{a} {b} {c} {d} {e} {f} {g} {h} {i} {j} {k} {l} {m} {n} {o} {p} {q} {r} {s} {t} {u} {v} {w} {x} {y} {z} {aa} {ab} {ac} {ad} {ae} {af} {ag} {ah} {ai} {aj} {ak} {al} {am} {an} {ao} {ap} {aq} {ar} {as} {at} {au} {av} {aw} {ax}',
        {
          a: 'a',
          aa: 'aa',
          ab: 'ab',
          ac: 'ac',
          ad: 'ad',
          ae: 'ae',
          af: 'af',
          ag: 'ag',
          ah: 'ah',
          ai: 'ai',
          aj: 'aj',
          ak: 'ak',
          al: 'al',
          am: 'am',
          an: 'an',
          ao: 'ao',
          ap: 'ap',
          aq: 'aq',
          ar: 'ar',
          as: 'as',
          at: 'at',
          au: 'au',
          av: 'av',
          aw: 'aw',
          ax: 'ax',
          b: 'b',
          c: 'c',
          d: 'd',
          e: 'e',
          f: 'f',
          g: 'g',
          h: 'h',
          i: 'i',
          j: 'j',
          k: 'k',
          l: 'l',
          m: 'm',
          n: 'n',
          o: 'o',
          p: 'p',
          q: 'q',
          r: 'r',
          s: 's',
          t: 't',
          u: 'u',
          v: 'v',
          w: 'w',
          x: 'x',
          y: 'y',
          z: 'z',
        },
      ),
    ).toEqualTypeOf<string>();
  });
});
