import type { SearchData } from '@yapyak/docs-compiler';
import type { KeyboardEvent } from 'react';
import type { SearchResult } from '#lib/search-result';

import { useEffect, useMemo, useState } from 'react';

import { KEY_MAP } from '#constants';
import { getSearchResults } from '#lib/search-result';

export type UseSearchOptions = {
  listboxId: string;
  onSelect: (href: string) => void;
  searchData: SearchData | undefined;
};

export type UseSearchReturn = {
  activeId: string | undefined;
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleSelect: (href: string) => void;
  hasResults: boolean;
  highlightedHref: null | string;
  isPopulated: boolean;
  query: string;
  results: SearchResult[];
  setHighlightedHref: (href: null | string) => void;
  setQuery: (query: string) => void;
};

export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const { listboxId, onSelect, searchData } = options;

  const [query, setQuery] = useState('');
  const [highlightedHref, setHighlightedHref] = useState<null | string>(null);

  const results = useMemo(() => {
    if (searchData === undefined) {
      return [];
    }
    return getSearchResults(searchData, query);
  }, [
    searchData,
    query,
  ]);

  useEffect(() => {
    setHighlightedHref(results[0]?.entry.href ?? null);
  }, [
    results,
  ]);

  const handleSelect = (href: string) => {
    onSelect(href);
  };

  const moveHighlight = (delta: number) => {
    const index = results.findIndex(
      (result) => result.entry.href === highlightedHref,
    );
    const current = index === -1 ? 0 : index;
    const nextIndex = Math.max(
      0,
      Math.min(results.length - 1, current + delta),
    );
    setHighlightedHref(results[nextIndex]?.entry.href ?? null);
  };

  const pageSize = () => {
    const listboxElement = window.document.getElementById(listboxId);
    const optionElement =
      listboxElement?.querySelector<HTMLElement>('[role="option"]');
    if (!listboxElement || !optionElement) {
      return 1;
    }
    return Math.max(
      1,
      Math.floor(
        listboxElement.clientHeight / (optionElement.offsetHeight || 1),
      ),
    );
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) {
      return;
    }
    const { key } = event;
    if (key === KEY_MAP.down) {
      event.preventDefault();
      moveHighlight(1);
    } else if (key === KEY_MAP.up) {
      event.preventDefault();
      moveHighlight(-1);
    } else if (key === KEY_MAP.home) {
      event.preventDefault();
      setHighlightedHref(results[0]?.entry.href ?? null);
    } else if (key === KEY_MAP.end) {
      event.preventDefault();
      setHighlightedHref(results.at(-1)?.entry.href ?? null);
    } else if (key === KEY_MAP.pageDown) {
      event.preventDefault();
      moveHighlight(pageSize());
    } else if (key === KEY_MAP.pageUp) {
      event.preventDefault();
      moveHighlight(-pageSize());
    } else if (key === KEY_MAP.enter && highlightedHref !== null) {
      event.preventDefault();
      handleSelect(highlightedHref);
    }
  };

  const hasResults = results.length > 0;
  const isPopulated = hasResults || query.length > 0;
  const activeId =
    highlightedHref === null
      ? undefined
      : `${listboxId}-option-${highlightedHref}`;

  return {
    activeId,
    handleInputKeyDown,
    handleSelect,
    hasResults,
    highlightedHref,
    isPopulated,
    query,
    results,
    setHighlightedHref,
    setQuery,
  };
}
