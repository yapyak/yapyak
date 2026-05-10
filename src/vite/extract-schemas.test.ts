import { describe, expect, it } from 'vitest';
import { extractSchemas } from './extract-schemas.js';

describe('extractSchemas', () => {
  it('extracts a flat schema from defineTranslations', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const t = defineTranslations({
        greeting: 'Hello {name}',
        cta: 'Open inbox',
      });
    `;
    const result = extractSchemas(code, 'src/test.tsx');
    expect(result).toEqual([
      {
        fileId: 'src/test.tsx',
        schema: {
          cta: 'Open inbox',
          greeting: 'Hello {name}',
        },
        variableName: 't',
      },
    ]);
  });

  it('extracts nested schemas', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const t = defineTranslations({
        buttons: {
          save: 'Save',
          cancel: 'Cancel',
        },
        errors: {
          notFound: 'Not found',
        },
      });
    `;
    const [extracted] = extractSchemas(code, 'src/forms.tsx');
    expect(extracted?.schema).toEqual({
      buttons: { cancel: 'Cancel', save: 'Save' },
      errors: { notFound: 'Not found' },
    });
  });

  it('returns empty when defineTranslations is not imported', () => {
    const code = `
      const t = defineTranslations({ cta: 'Open' });
    `;
    expect(extractSchemas(code, 'src/file.tsx')).toEqual([]);
  });

  it('respects renamed imports', () => {
    const code = `
      import { defineTranslations as dt } from 'yapyak/react';
      const t = dt({ cta: 'Open inbox' });
    `;
    const result = extractSchemas(code, 'src/file.tsx');
    expect(result.length).toBe(1);
    expect(result[0]?.schema).toEqual({ cta: 'Open inbox' });
  });

  it('ignores defineTranslations imported from non-yapyak modules', () => {
    const code = `
      import { defineTranslations } from 'other-lib';
      const t = defineTranslations({ cta: 'Open' });
    `;
    expect(extractSchemas(code, 'src/file.tsx')).toEqual([]);
  });

  it('handles multiple defineTranslations calls in one file', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const a = defineTranslations({ greeting: 'Hi' });
      const b = defineTranslations({ farewell: 'Bye' });
    `;
    const result = extractSchemas(code, 'src/file.tsx');
    expect(result).toHaveLength(2);
    expect(result[0]?.variableName).toBe('a');
    expect(result[1]?.variableName).toBe('b');
  });

  it('captures variableName when assigned to a variable', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const messages = defineTranslations({ cta: 'Open' });
    `;
    const [extracted] = extractSchemas(code, 'src/file.tsx');
    expect(extracted?.variableName).toBe('messages');
  });

  it('returns undefined variableName for inline calls', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      export default defineTranslations({ cta: 'Open' });
    `;
    const [extracted] = extractSchemas(code, 'src/file.tsx');
    expect(extracted?.variableName).toBeUndefined();
  });

  it('rejects schemas with non-string values', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const dynamic = 'foo';
      const t = defineTranslations({ greeting: dynamic });
    `;
    expect(extractSchemas(code, 'src/file.tsx')).toEqual([]);
  });

  it('rejects schemas with computed keys', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const key = 'greeting';
      const t = defineTranslations({ [key]: 'Hello' });
    `;
    expect(extractSchemas(code, 'src/file.tsx')).toEqual([]);
  });

  it('handles tagged template literal style imports', () => {
    const code = `
      import { defineTranslations } from "yapyak";
      const t = defineTranslations({ cta: \`Open inbox\` });
    `;
    const [extracted] = extractSchemas(code, 'src/file.tsx');
    expect(extracted?.schema).toEqual({ cta: 'Open inbox' });
  });

  it('skips template literals with substitutions', () => {
    const code = `
      import { defineTranslations } from 'yapyak/react';
      const name = 'world';
      const t = defineTranslations({ greeting: \`Hello \${name}\` });
    `;
    expect(extractSchemas(code, 'src/file.tsx')).toEqual([]);
  });

  it('extracts when imported from yapyak root', () => {
    const code = `
      import { defineTranslations } from 'yapyak';
      const t = defineTranslations({ cta: 'Open' });
    `;
    expect(extractSchemas(code, 'src/file.ts')).toHaveLength(1);
  });

  it('extracts when imported from yapyak/vue', () => {
    const code = `
      import { defineTranslations } from 'yapyak/vue';
      const t = defineTranslations({ cta: 'Open' });
    `;
    expect(extractSchemas(code, 'src/file.ts')).toHaveLength(1);
  });
});
