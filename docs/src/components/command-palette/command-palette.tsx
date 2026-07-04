import type { SearchData } from '@yapyak/doc-compiler';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Dialog } from '#components/dialog';
import { Icon } from '#components/icon';
import { KEY_MAP } from '#constants';
import { getSearchResults } from '#lib/search-result';
import { Box } from '#primitives/box';

import styles from './command-palette.module.css';
import { CommandPaletteListbox } from './command-palette-listbox';

const LISTBOX_ID = 'command-palette-listbox';

export type CommandPaletteProps = {
  id: string;
  onClose: () => void;
  open: boolean;
  searchData: SearchData | undefined;
};

export function CommandPalette(props: CommandPaletteProps) {
  const { id, onClose, open, searchData } = props;

  const navigate = useNavigate();
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
    if (!open) {
      setQuery('');
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      inputElement.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    open,
  ]);

  useEffect(() => {
    setHighlightedHref(results[0]?.entry.href ?? null);
  }, [
    results,
  ]);

  const handleSelect = (href: string) => {
    const hashIndex = href.indexOf('#');
    const pathname = hashIndex < 0 ? href : href.slice(0, hashIndex);
    const hash = hashIndex < 0 ? undefined : href.slice(hashIndex + 1);
    void navigate({
      hash,
      to: pathname,
    });
    onClose();
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

  const handleDialogMouseDown = (event: MouseEvent) => {
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
      className={styles.CommandPalette}
      data-populated={isPopulated}
      id={id}
      onClose={onClose}
      onMouseDown={handleDialogMouseDown}
      open={open}
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
        <CommandPaletteListbox
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
