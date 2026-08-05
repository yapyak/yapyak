import type { Range } from '../processor';
import type { BuildDiagnosticContext } from './catalog';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetWarn, setWarn } from '../warn';
import {
  YAP_COMPILE,
  YAP_RUNTIME,
  buildDiagnostic,
  getDocsUrl,
  warnDiagnostic,
} from './catalog';

const RANGE: Range = {
  end: {
    column: 1,
    line: 1,
    offset: 1,
  },
  start: {
    column: 1,
    line: 1,
    offset: 0,
  },
};

const CONTEXT: BuildDiagnosticContext = {
  fileId: 'src/a.tsx',
  range: RANGE,
  severity: 'error',
};

describe('buildDiagnostic', () => {
  it('builds a diagnostic when the entry has a `hint` function', () => {
    const diagnostic = buildDiagnostic(
      'PARSER_NO_SOURCE',
      {
        method: 't',
      },
      CONTEXT,
    );

    expect(diagnostic).toEqual({
      code: 'YAP0001',
      fileId: 'src/a.tsx',
      hint: 'Pass the English source as the first (or, for `t.as()`, second) argument.',
      message: '`t()` called without arguments.',
      range: RANGE,
      severity: 'error',
    });
  });

  it('builds a diagnostic when the entry has no `hint` function', () => {
    const diagnostic = buildDiagnostic(
      'CATALOG_UNSAFE_PATH',
      {
        pathKey: '../shared/Bar.tsx',
      },
      CONTEXT,
    );

    expect(diagnostic).toEqual({
      code: 'YAP0014',
      fileId: 'src/a.tsx',
      hint: undefined,
      message:
        'Unsafe file-path key "../shared/Bar.tsx". Paths must be relative, use forward slashes, and contain no ".." segments.',
      range: RANGE,
      severity: 'error',
    });
  });
});

describe('getDocsUrl', () => {
  it('builds the docs URL for a YAP code', () => {
    expect(getDocsUrl('YAP0001')).toBe(
      'https://yapyak.dev/reference/diagnostics/YAP0001',
    );
  });
});

describe('warnDiagnostic', () => {
  let warnSpy: ReturnType<
    typeof vi.fn<(message: string, meta?: Record<string, unknown>) => void>
  >;

  beforeEach(() => {
    warnSpy =
      vi.fn<(message: string, meta?: Record<string, unknown>) => void>();
    setWarn(warnSpy);
  });

  afterEach(() => {
    resetWarn();
  });

  it('warns with the entry code prefix and docs URL appended', () => {
    warnDiagnostic('LOCALE_SET_IGNORED', {
      value: 'de',
    });

    expect(warnSpy).toHaveBeenCalledWith(
      `YAP0028 setLocale call ignored. Value "de" is not in the configured locales.\nSee https://yapyak.dev/reference/diagnostics/YAP0028`,
      expect.anything(),
    );
  });

  it('writes the entry code into `meta.code`', () => {
    warnDiagnostic('LOCALE_SET_IGNORED', {
      value: 'de',
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), {
      code: 'YAP0028',
    });
  });

  it('folds caller meta into the meta argument', () => {
    warnDiagnostic(
      'LOCALE_SET_IGNORED',
      {
        value: 'de',
      },
      {
        requested: 'de',
      },
    );

    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), {
      code: 'YAP0028',
      requested: 'de',
    });
  });

  it('warns for entries without a `hint` function', () => {
    warnDiagnostic('TRANSLATE_CHUNK_FAILED', undefined);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/^YAP0033 /), {
      code: 'YAP0033',
    });
  });
});

describe('YAP_COMPILE', () => {
  it('holds every entry in the `YAP<NNNN>` code format', () => {
    const patternRx = /^YAP\d{4}$/;
    for (const entry of Object.values(YAP_COMPILE)) {
      expect(entry.code).toMatch(patternRx);
    }
  });

  it('holds every code as unique across `YAP_COMPILE` and `YAP_RUNTIME`', () => {
    const codes = [
      ...Object.values(YAP_COMPILE),
      ...Object.values(YAP_RUNTIME),
    ].map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('holds all codes sequentially from `YAP0001` across `YAP_COMPILE` and `YAP_RUNTIME`', () => {
    const numbers = [
      ...Object.values(YAP_COMPILE),
      ...Object.values(YAP_RUNTIME),
    ].map((entry) => Number.parseInt(entry.code.slice(3), 10));
    const sorted = [
      ...numbers,
    ].sort((a, b) => a - b);
    for (const [index, value] of sorted.entries()) {
      expect(value).toBe(index + 1);
    }
  });

  it('holds codes in ascending declaration order', () => {
    const numbers = Object.values(YAP_COMPILE).map((entry) =>
      Number.parseInt(entry.code.slice(3), 10),
    );
    const sorted = [
      ...numbers,
    ].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });
});

describe('YAP_RUNTIME', () => {
  it('holds every entry in the `YAP<NNNN>` code format', () => {
    const patternRx = /^YAP\d{4}$/;
    for (const entry of Object.values(YAP_RUNTIME)) {
      expect(entry.code).toMatch(patternRx);
    }
  });

  it('holds codes in ascending declaration order', () => {
    const numbers = Object.values(YAP_RUNTIME).map((entry) =>
      Number.parseInt(entry.code.slice(3), 10),
    );
    const sorted = [
      ...numbers,
    ].sort((a, b) => a - b);
    expect(numbers).toEqual(sorted);
  });
});
