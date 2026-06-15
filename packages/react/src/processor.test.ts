import { describe, expect, it } from 'vitest';
import { extractFile, transformFile } from 'yapyak/compiler/internal';

import { react } from './processor';

const processors = [
  react(),
];

function runReactTransform(input: {
  source: string;
  locales: string[];
  fileId?: string;
  dev?: boolean;
}): string {
  const fileId = input.fileId ?? 'src/a.tsx';
  const extracted = extractFile(fileId, input.source, {
    processors,
  });
  const request: Parameters<typeof transformFile>[0] = {
    extracted,
    fileId,
    locales: input.locales,
    processors,
    source: input.source,
    translations: {},
  };
  if (input.dev !== undefined) {
    request.dev = input.dev;
  }
  return transformFile(request).code;
}

describe('react processor', () => {
  it('returns a processor with the `react` id', () => {
    expect(react().id).toBe('react');
  });

  it('returns a processor that handles `.tsx` and `.jsx` files', () => {
    expect(react().extensions).toEqual([
      '.tsx',
      '.jsx',
    ]);
  });

  it('returns a processor that declares `@yapyak/react/internal` as the runtime module', () => {
    expect(react().runtime?.module).toBe('@yapyak/react/internal');
  });

  it('returns a processor that declares `useYapyak` as the runtime invocation', () => {
    expect(react().runtime?.invoke).toBe('useYapyak');
  });

  it('emits a `useYapyak` import in dev builds', () => {
    const code = runReactTransform({
      dev: true,
      locales: [
        'en',
        'sv',
      ],
      source: [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    });
    expect(code).toMatch(/useYapyak as _useYapyak/);
    expect(code).toContain("from '@yapyak/react/internal'");
  });

  it('emits a `useYapyak` import in production builds', () => {
    const code = runReactTransform({
      locales: [
        'en',
        'sv',
      ],
      source: [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    });
    expect(code).toMatch(/useYapyak as _useYapyak/);
    expect(code).toContain("from '@yapyak/react/internal'");
  });

  it('skips HMR catalog wiring in production builds', () => {
    const code = runReactTransform({
      locales: [
        'en',
        'sv',
      ],
      source: [
        "import { t } from 'yapyak';",
        'export function Header() {',
        "  return t('Hello');",
        '}',
      ].join('\n'),
    });
    expect(code).not.toMatch(/_registerCatalog/);
    expect(code).not.toMatch(/_invalidateFile/);
  });
});
