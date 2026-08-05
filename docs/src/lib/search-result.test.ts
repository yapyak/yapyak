import type { SearchData, SearchEntry } from '@yapyak/docs-compiler';

import { describe, expect, it } from 'vitest';

import { getSearchResults } from './search-result';

function entry(overrides: Partial<SearchEntry> = {}): SearchEntry {
  return {
    body: '',
    breadcrumbs: [],
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

  it('returns no result when nothing matches, even for a page entry', () => {
    expect(
      getSearchResults(
        searchData([
          entry({
            body: 'Cancel',
            kind: 'page',
            title: 'Save',
          }),
        ]),
        'zxqwv',
      ),
    ).toEqual([]);
  });

  it('returns no result when a query word is missing', () => {
    expect(
      getSearchResults(
        searchData([
          entry({
            body: 'Cancel',
            title: 'Save',
          }),
        ]),
        'save cancel settings',
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

  it('prefers a shorter title on a shared prefix', () => {
    const results = getSearchResults(
      searchData([
        entry({
          href: '/guide/settings',
          title: 'Settings',
        }),
        entry({
          href: '/guide/save',
          title: 'Save',
        }),
      ]),
      's',
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

  it('returns the entry that matches every word of the query', () => {
    const results = getSearchResults(
      searchData([
        entry({
          href: '/guide/save-changes',
          title: 'Save changes',
        }),
        entry({
          href: '/guide/settings',
          title: 'Settings',
        }),
      ]),
      'save changes',
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.entry.title).toBe('Save changes');
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
