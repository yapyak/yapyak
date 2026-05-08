import { describe, expect, it } from 'vitest';
import { extractMessages } from './extract-messages';

const factories = new Set(['intl']);

describe('extractMessages', () => {
  it('extracts simple t() calls', () => {
    const code = `intl.t('Welcome!');`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.source).toBe('Welcome!');
  });

  it('extracts t() with params', () => {
    const code = `intl.t('Hello, {name}!', { name: 'Joakim' });`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result[0]?.source).toBe('Hello, {name}!');
  });

  it('extracts multiple t() calls', () => {
    const code = `
      intl.t('First');
      intl.t('Second');
      intl.t('Third');
    `;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result).toHaveLength(3);
    expect(result.map((m) => m.source)).toEqual(['First', 'Second', 'Third']);
  });

  it('records line and column', () => {
    const code = `let a = 1;\nintl.t('Hi');`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result[0]?.line).toBe(2);
  });

  it('ignores t() from other namespaces', () => {
    const code = `other.t('Skip me'); intl.t('Take me');`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.source).toBe('Take me');
  });

  it('handles double quotes', () => {
    const code = `intl.t("With double quotes");`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result[0]?.source).toBe('With double quotes');
  });

  it('handles escaped quotes', () => {
    const code = `intl.t('It\\'s working');`;
    const result = extractMessages({
      code,
      factoryNames: factories,
      fileId: 'test.tsx',
    });
    expect(result[0]?.source).toBe("It's working");
  });
});
