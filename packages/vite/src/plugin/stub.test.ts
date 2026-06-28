import type { ExtractedMessage, LocaleData } from 'yapyak/compiler/internal';
import type { Translator } from 'yapyak/translator';
import type { LocaleResolver } from '../locale-resolver';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeYapyakConfig } from 'yapyak/config/internal';

import { createState } from './state';
import { fillStubs } from './stub';

afterEach(() => {
  vi.restoreAllMocks();
});

function buildResolver(localeData: LocaleData = {}): LocaleResolver {
  return {
    getDiscovery: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
      warnings: [],
    }),
    getEmittedLocales: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
    }),
    getLocaleData: () => localeData,
    getProjectLocales: () => ({
      defaultLocale: 'en',
      locales: [
        'en',
        'sv',
      ],
    }),
    invalidateData: () => {},
    invalidateStructure: () => {},
  };
}

function buildMessage(source: string): ExtractedMessage {
  return {
    id: source,
    locations: [
      {
        callSiteContext: {},
        fileId: 'src/a.tsx',
        range: {
          end: {
            column: 5,
            line: 1,
            offset: 5,
          },
          start: {
            column: 1,
            line: 1,
            offset: 0,
          },
        },
      },
    ],
    placeholders: [],
    source,
  };
}

describe('fillStubs', () => {
  it('notifies the previous controller when called a second time', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const translator: Translator = Object.assign(
      () => new Promise<string>(() => {}),
      {
        batch: () => new Promise<string[]>(() => {}),
        id: 'mock',
      },
    );
    const state = createState();
    state.normalized = normalizeYapyakConfig({
      translator,
    });
    state.resolver = buildResolver();
    state.messagesByFile.set('src/a.tsx', [
      buildMessage('Hello'),
    ]);

    fillStubs(state);
    const first = state.autoTranslateController;
    expect(first).toBeDefined();
    expect(first?.signal.aborted).toBe(false);

    fillStubs(state);
    const second = state.autoTranslateController;
    expect(first?.signal.aborted).toBe(true);
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
    expect(second?.signal.aborted).toBe(false);
  });

  it('notifies the previous controller when called with no missing strings', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const translator: Translator = Object.assign(
      () => new Promise<string>(() => {}),
      {
        batch: () => new Promise<string[]>(() => {}),
        id: 'mock',
      },
    );
    const state = createState();
    state.normalized = normalizeYapyakConfig({
      translator,
    });
    state.resolver = buildResolver({
      sv: {
        'src/a.tsx': {
          Hello: 'Hej',
        },
      },
    });
    state.messagesByFile.set('src/a.tsx', [
      buildMessage('Hello'),
    ]);

    state.autoTranslateController = new AbortController();
    const previous = state.autoTranslateController;

    fillStubs(state);

    expect(previous.signal.aborted).toBe(true);
    expect(state.autoTranslateController).toBeUndefined();
  });
});
