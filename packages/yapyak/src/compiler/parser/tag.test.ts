import { describe, expect, it } from 'vitest';

import { validateRichTextTags } from './tag';

describe('validateRichTextTags', () => {
  it('returns no issues when the source has no tags', () => {
    expect(validateRichTextTags('Save changes')).toEqual([]);
  });

  it('returns no issues when paired tags match', () => {
    expect(validateRichTextTags('Read <link>terms</link>')).toEqual([]);
  });

  it('returns no issues when paired tags are nested', () => {
    expect(validateRichTextTags('<b><link>terms</link></b>')).toEqual([]);
  });

  it('returns no issues when the source has a void tag', () => {
    expect(validateRichTextTags('line<br/>break')).toEqual([]);
  });

  it('returns no issues when a void tag has a space before the slash', () => {
    expect(validateRichTextTags('line<br />break')).toEqual([]);
  });

  it('returns no issues when a tag has attributes', () => {
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
