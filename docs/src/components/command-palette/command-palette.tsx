import type { SearchIndex } from '@yapyak/doc-compiler';
import type { ChangeEvent, KeyboardEvent } from 'react';

import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from 'yapyak';

import { Dialog } from '#components/dialog';
import { Icon } from '#components/icon';
import { KEY_MAP } from '#constants';
import { getSearchResults } from '#lib/search-result';
import { Box } from '#primitives/box';

import styles from './command-palette.module.css';
import { CommandPaletteItem } from './command-palette-item';

const LIST_ID = 'command-palette-list';

export type CommandPaletteProps = {
  id: string;
  index: SearchIndex | undefined;
  onClose: () => void;
  open: boolean;
};

export function CommandPalette(props: CommandPaletteProps) {
  const { id, index, onClose, open } = props;

  const inputElement = useRef<HTMLInputElement>(null);
  const listElement = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    if (index === undefined) {
      return [];
    }
    return getSearchResults(index, query);
  }, [
    index,
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
    const activeElement = listElement.current?.querySelector(
      `#command-palette-option-${activeIndex}`,
    );
    activeElement?.scrollIntoView({
      block: 'nearest',
    });
  }, [
    activeIndex,
  ]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setActiveIndex(0);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === KEY_MAP.down) {
      event.preventDefault();
      setActiveIndex((value) => Math.min(results.length - 1, value + 1));
    } else if (event.key === KEY_MAP.up) {
      event.preventDefault();
      setActiveIndex((value) => Math.max(0, value - 1));
    } else if (event.key === KEY_MAP.enter) {
      event.preventDefault();
      const activeLinkElement =
        listElement.current?.querySelector('[data-active] a');
      if (activeLinkElement instanceof HTMLElement) {
        activeLinkElement.click();
      }
    }
  };

  const hasResults = results.length > 0;
  const activeId = hasResults
    ? `command-palette-option-${activeIndex}`
    : undefined;

  return (
    <Dialog
      className={styles.CommandPalette}
      id={id}
      onClose={onClose}
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
          aria-controls={LIST_ID}
          aria-expanded={hasResults}
          aria-label={t('Search documentation')}
          as="input"
          autoComplete="off"
          className={styles.SearchInput}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={t('Search documentation')}
          ref={inputElement}
          role="combobox"
          value={query}
        />
      </Box>
      {hasResults && (
        <Box
          as="ul"
          className={styles.List}
          id={LIST_ID}
          ref={listElement}
          role="listbox"
        >
          {results.map((result, resultIndex) => (
            <CommandPaletteItem
              active={resultIndex === activeIndex}
              id={`command-palette-option-${resultIndex}`}
              key={result.entry.href}
              result={result}
            />
          ))}
        </Box>
      )}
      {query.length > 0 && !hasResults && (
        <Box className={styles.EmptyMessage}>{t('No results found')}</Box>
      )}
    </Dialog>
  );
}
