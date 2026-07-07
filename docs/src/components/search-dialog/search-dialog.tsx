import type { SearchData } from '@yapyak/doc-compiler';
import type { ChangeEvent, PointerEvent } from 'react';
import type { DialogProps } from '#components/dialog';

import { useLayoutEffect, useRef } from 'react';
import { t } from 'yapyak';

import { Dialog } from '#components/dialog';
import { Icon } from '#components/icon';
import { useSearch } from '#hooks/use-search';
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
  const search = useSearch({
    listboxId: LISTBOX_ID,
    onSelect: (href) => {
      onSelect(href);
      onClose?.();
    },
    searchData,
  });

  useLayoutEffect(() => {
    inputElement.current?.focus();
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    search.setQuery(event.target.value);
  };

  const handleDialogPointerDown = (event: PointerEvent) => {
    if (
      event.pointerType === 'mouse' &&
      event.target !== inputElement.current
    ) {
      event.preventDefault();
    }
  };

  return (
    <Dialog
      {...restProps}
      className={[
        styles.SearchDialog,
        className,
      ]}
      data-populated={search.isPopulated}
      onClose={onClose}
      onPointerDown={handleDialogPointerDown}
    >
      <Box className={styles.SearchBar}>
        <Icon
          className={styles.SearchIcon}
          name="search"
        />
        <Box
          aria-activedescendant={search.activeId}
          aria-autocomplete="list"
          aria-controls={LISTBOX_ID}
          aria-expanded={search.hasResults}
          aria-label={t('Search...')}
          as="input"
          autoComplete="off"
          className={styles.SearchInput}
          onChange={handleInputChange}
          onKeyDown={search.handleInputKeyDown}
          placeholder={t('Search...')}
          ref={inputElement}
          role="combobox"
          value={search.query}
        />
      </Box>
      {search.hasResults && (
        <SearchDialogListbox
          highlightedHref={search.highlightedHref}
          id={LISTBOX_ID}
          onHighlightChange={search.setHighlightedHref}
          onSelect={search.handleSelect}
          results={search.results}
        />
      )}
      {search.query.length > 0 && !search.hasResults && (
        <Box className={styles.EmptyMessage}>{t('No results found')}</Box>
      )}
    </Dialog>
  );
}
