import type { SearchData } from '@yapyak/doc-compiler';
import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react';
import type { DialogProps } from '#components/dialog';

import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Dialog } from '#components/dialog';
import { Icon } from '#components/icon';
import { KEY_MAP } from '#constants';
import { getSearchResults } from '#lib/search-result';
import { Box } from '#primitives/box';

import styles from './search-dialog.module.css';
import { SearchDialogListbox } from './search-dialog-listbox';

const LISTBOX_ID = 'search-dialog-listbox';

export type SearchDialogProps = Omit<DialogProps, 'onSelect'> & {
  onSelect: (href: string) => void;
  searchData: SearchData | undefined;
};

export function SearchDialog(props: SearchDialogProps) {
  const { className, onSelect, searchData, onClose, ...restProps } = props;

  const inputElement = useRef<HTMLInputElement>(null);
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
    const frame = window.requestAnimationFrame(() => {
      inputElement.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setHighlightedHref(results[0]?.entry.href ?? null);
  }, [
    results,
  ]);

  const handleSelect = (href: string) => {
    onSelect(href);
    onClose?.();
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
    const listboxElement = window.document.getElementById(LISTBOX_ID);
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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleDialogPointerDown = (event: PointerEvent) => {
    if (event.target !== inputElement.current) {
      event.preventDefault();
    }
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
      : `${LISTBOX_ID}-option-${highlightedHref}`;

  return (
    <Dialog
      {...restProps}
      className={[
        styles.SearchDialog,
        className,
      ]}
      data-populated={isPopulated}
      onClose={onClose}
      onPointerDown={handleDialogPointerDown}
    >
      <Box className={styles.SearchBar}>
        <Icon
          className={styles.SearchIcon}
          name="search"
        />
        <Box
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-controls={LISTBOX_ID}
          aria-expanded={hasResults}
          aria-label={t('Search...')}
          as="input"
          autoComplete="off"
          className={styles.SearchInput}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={t('Search...')}
          ref={inputElement}
          role="combobox"
          value={query}
        />
      </Box>
      {hasResults && (
        <SearchDialogListbox
          highlightedHref={highlightedHref}
          id={LISTBOX_ID}
          onHighlightChange={setHighlightedHref}
          onSelect={handleSelect}
          results={results}
        />
      )}
      {query.length > 0 && !hasResults && (
        <Box className={styles.EmptyMessage}>{t('No results found')}</Box>
      )}
    </Dialog>
  );
}
