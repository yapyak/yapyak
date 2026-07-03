import type { SearchData, SearchEntry } from '@yapyak/doc-compiler';

import { describe, expect, it } from 'vitest';

import { getSearchResults } from './search-result';

function entry(overrides: Partial<SearchEntry> = {}): SearchEntry {
  return {
    body: '',
    breadcrumb: [],
    collection: 'guide',
    href: '/guide/save',
    kind: 'page',
    title: 'Save',
    ...overrides,
  };
}

function searchData(entries: SearchEntry[]): SearchData {
  return {
    entries,
    version: 1,
  };
}

describe('getSearchResults', () => {
  it('returns no result for an empty query', () => {
    expect(
      getSearchResults(
        searchData([
          entry(),
        ]),
        '',
      ),
    ).toEqual([]);
  });

  it('prefers an exact title match over a substring match', () => {
    const results = getSearchResults(
      searchData([
        entry({
          href: '/guide/save-changes',
          title: 'Save changes',
        }),
        entry({
          href: '/guide/save',
          title: 'Save',
        }),
      ]),
      'save',
    );

    expect(results[0]?.entry.title).toBe('Save');
  });

  it('builds the highlight range for the matched query', () => {
    const results = getSearchResults(
      searchData([
        entry({
          title: 'Settings',
        }),
      ]),
      'sett',
    );

    expect(results[0]?.ranges).toEqual([
      [
        0,
        4,
      ],
    ]);
  });

  it('finds a result by its body token', () => {
    const results = getSearchResults(
      searchData([
        entry({
          body: 'Cancel',
          title: 'Save',
        }),
      ]),
      'cancel',
    );

    expect(results).toHaveLength(1);
  });

  it('truncates results to the limit', () => {
    const entries = Array.from(
      {
        length: 25,
      },
      (_, position) =>
        entry({
          href: `/guide/save-${position}`,
          title: 'Save',
        }),
    );

    expect(getSearchResults(searchData(entries), 'save', 3)).toHaveLength(3);
  });
});
