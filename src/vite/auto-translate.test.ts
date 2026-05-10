import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import { autoTranslate } from './auto-translate.js';

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'yapyak-auto-'));
});

afterEach(() => {
  rmSync(projectRoot, { force: true, recursive: true });
});

function writeLocale(name: string, content: string): void {
  const fs = require('node:fs') as typeof import('node:fs');
  fs.mkdirSync(join(projectRoot, 'locales'), { recursive: true });
  writeFileSync(join(projectRoot, 'locales', `${name}.yml`), content);
}

function readLocale(name: string): unknown {
  return parse(
    readFileSync(join(projectRoot, 'locales', `${name}.yml`), 'utf-8'),
  );
}

describe('autoTranslate', () => {
  it('fills empty stubs by calling the translator', async () => {
    writeLocale(
      'en',
      'src/welcome.tsx:\n  greeting: Hello\n  cta: Open inbox\n',
    );
    writeLocale('sv', "src/welcome.tsx:\n  greeting: ''\n  cta: ''\n");

    const translator = vi
      .fn()
      .mockResolvedValueOnce('Hej')
      .mockResolvedValueOnce('Öppna inkorgen');

    const result = await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(result.translated).toBe(2);
    expect(translator).toHaveBeenCalledTimes(2);
    expect(readLocale('sv')).toEqual({
      'src/welcome.tsx': {
        cta: 'Öppna inkorgen',
        greeting: 'Hej',
      },
    });
  });

  it('skips already-translated entries', async () => {
    writeLocale(
      'en',
      'src/welcome.tsx:\n  greeting: Hello\n  cta: Open inbox\n',
    );
    writeLocale(
      'sv',
      "src/welcome.tsx:\n  greeting: Hej redan\n  cta: ''\n",
    );

    const translator = vi.fn().mockResolvedValue('Öppna inkorgen');
    const result = await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(result.translated).toBe(1);
    expect(translator).toHaveBeenCalledTimes(1);
    const sv = readLocale('sv') as Record<string, Record<string, string>>;
    expect(sv['src/welcome.tsx']?.greeting).toBe('Hej redan');
    expect(sv['src/welcome.tsx']?.cta).toBe('Öppna inkorgen');
  });

  it('does not call translator for default locale', async () => {
    writeLocale('en', 'src/welcome.tsx:\n  greeting: Hello\n');
    const translator = vi.fn();
    await autoTranslate({
      defaultLocale: 'en',
      locales: ['en'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });
    expect(translator).not.toHaveBeenCalled();
  });

  it('passes correct request to translator', async () => {
    writeLocale('en', 'src/welcome.tsx:\n  greeting: Hello {name}\n');
    writeLocale('sv', "src/welcome.tsx:\n  greeting: ''\n");

    const translator = vi.fn().mockResolvedValue('Hej {name}');
    await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(translator).toHaveBeenCalledWith({
      fileId: 'src/welcome.tsx',
      key: 'greeting',
      source: 'Hello {name}',
      sourceLocale: 'en',
      targetLocale: 'sv',
    });
  });

  it('reports errors without crashing', async () => {
    writeLocale(
      'en',
      'src/welcome.tsx:\n  greeting: Hello\n  cta: Open inbox\n',
    );
    writeLocale('sv', "src/welcome.tsx:\n  greeting: ''\n  cta: ''\n");

    const translator = vi
      .fn()
      .mockRejectedValueOnce(new Error('rate limit'))
      .mockResolvedValueOnce('Öppna inkorgen');

    const result = await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      fileId: 'src/welcome.tsx',
      key: 'greeting',
      locale: 'sv',
    });
    expect(result.translated).toBe(1);
  });

  it('handles multiple locales', async () => {
    writeLocale('en', 'src/welcome.tsx:\n  greeting: Hello\n');
    writeLocale('sv', "src/welcome.tsx:\n  greeting: ''\n");
    writeLocale('fr', "src/welcome.tsx:\n  greeting: ''\n");

    const translator = vi
      .fn()
      .mockResolvedValueOnce('Hej')
      .mockResolvedValueOnce('Bonjour');

    await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv', 'fr'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(translator).toHaveBeenCalledTimes(2);
    const sv = readLocale('sv') as Record<string, Record<string, string>>;
    const fr = readLocale('fr') as Record<string, Record<string, string>>;
    expect(sv['src/welcome.tsx']?.greeting).toBe('Hej');
    expect(fr['src/welcome.tsx']?.greeting).toBe('Bonjour');
  });

  it('returns 0 when no stubs to translate', async () => {
    writeLocale('en', 'src/welcome.tsx:\n  greeting: Hello\n');
    writeLocale('sv', 'src/welcome.tsx:\n  greeting: Hej\n');

    const translator = vi.fn();
    const result = await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    expect(result.translated).toBe(0);
    expect(translator).not.toHaveBeenCalled();
  });

  it('trims translator output', async () => {
    writeLocale('en', 'src/welcome.tsx:\n  greeting: Hello\n');
    writeLocale('sv', "src/welcome.tsx:\n  greeting: ''\n");

    const translator = vi.fn().mockResolvedValue('  Hej  \n');
    await autoTranslate({
      defaultLocale: 'en',
      locales: ['en', 'sv'],
      localesDir: 'locales',
      projectRoot,
      translator,
    });

    const sv = readLocale('sv') as Record<string, Record<string, string>>;
    expect(sv['src/welcome.tsx']?.greeting).toBe('Hej');
  });
});
