import { describe, expect, it } from 'vitest';

import { validateRichTextTags } from './tag';

describe('validateRichTextTags', () => {
  it('returns no issues for a source without tags', () => {
    expect(validateRichTextTags('Save changes')).toEqual([]);
  });

  it('returns no issues for matching paired tags', () => {
    expect(validateRichTextTags('Read <link>terms</link>')).toEqual([]);
  });

  it('returns no issues for nested matching tags', () => {
    expect(validateRichTextTags('<b><link>terms</link></b>')).toEqual([]);
  });

  it('returns no issues for a void tag', () => {
    expect(validateRichTextTags('line<br/>break')).toEqual([]);
  });

  it('returns no issues for a void tag with a space before the slash', () => {
    expect(validateRichTextTags('line<br />break')).toEqual([]);
  });

  it('returns no issues for a tag with attributes treated as literal text', () => {
    expect(validateRichTextTags('an <a href="x">html</a> link')).toEqual([]);
  });

  it('refuses an empty `<>` tag', () => {
    expect(validateRichTextTags('This example uses<> cool')).toEqual([
      {
        kind: 'name-missing',
      },
    ]);
  });

  it('refuses an empty `</>` closing tag', () => {
    expect(validateRichTextTags('This example uses</> cool')).toEqual([
      {
        kind: 'name-missing',
      },
    ]);
  });

  it('refuses an opening tag with no closing tag', () => {
    expect(validateRichTextTags('Read <link>terms')).toEqual([
      {
        kind: 'unclosed-open',
        name: 'link',
      },
    ]);
  });

  it('refuses a closing tag with no opening tag', () => {
    expect(validateRichTextTags('terms</link>')).toEqual([
      {
        kind: 'unopened-close',
        name: 'link',
      },
    ]);
  });

  it('refuses a closing tag that does not match the opening', () => {
    expect(validateRichTextTags('<link>terms</bold>')).toEqual([
      {
        actual: 'bold',
        expected: 'link',
        kind: 'mismatched-close',
      },
      {
        kind: 'unclosed-open',
        name: 'link',
      },
    ]);
  });

  it('refuses interleaved tags as a mismatched close with the outer opening left unclosed', () => {
    expect(validateRichTextTags('<b><i>x</b></i>')).toEqual([
      {
        actual: 'b',
        expected: 'i',
        kind: 'mismatched-close',
      },
      {
        kind: 'unclosed-open',
        name: 'b',
      },
    ]);
  });
});
