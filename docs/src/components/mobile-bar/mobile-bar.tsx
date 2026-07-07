import type { ChangeEvent } from 'react';
import type { BoxProps } from '#primitives/box';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { t } from 'yapyak';

import { Icon } from '#components/icon';
import { IconLink } from '#components/icon-link';
import { MobileDialog } from '#components/mobile-dialog';
import { MobileDialogButton } from '#components/mobile-dialog-button';
import { SearchDialogListbox } from '#components/search-dialog';
import { useSearch } from '#hooks/use-search';
import { useSearchData } from '#hooks/use-search-data';
import { useSearchNavigation } from '#hooks/use-search-navigation';
import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';
import { LinkBase } from '#primitives/link';
import { Animate } from '#systems/animate';

import styles from './mobile-bar.module.css';

const LISTBOX_ID = 'mobile-search-listbox';

export type MobileMode = 'closed' | 'menu' | 'search';

export type MobileBarProps = BoxProps & {
  mode: MobileMode;
  onModeChange: (mode: MobileMode) => void;
};

export function MobileBar(props: MobileBarProps) {
  const { className, mode, onModeChange, ...restProps } = props;
  const inputElement = useRef<HTMLInputElement>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchData = useSearchData(hasSearched);

  const handleSelect = useSearchNavigation();

  const search = useSearch({
    listboxId: LISTBOX_ID,
    onSelect: handleSelect,
    searchData,
  });

  const { setQuery } = search;

  useEffect(() => {
    if (mode !== 'search') {
      setQuery('');
    }
  }, [
    mode,
    setQuery,
  ]);

  const handleSearchOpen = () => {
    setHasSearched(true);

    flushSync(() => {
      onModeChange('search');
    });
    inputElement.current?.focus({
      preventScroll: true,
    });
  };

  const handleToggle = () => {
    onModeChange(mode === 'closed' ? 'menu' : 'closed');
  };

  const handleClose = () => {
    onModeChange('closed');
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const isOpen = mode !== 'closed';

  return (
    <>
      <Box
        {...restProps}
        className={[
          styles.MobileBar,
          className,
        ]}
        data-mode={mode}
      >
        {mode === 'search' ? (
          <Box className={styles.SearchBar}>
            <Icon
              className={styles.SearchIcon}
              name="search"
              size="20"
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
        ) : (
          <ButtonBase
            aria-label={t('Search')}
            className={styles.SearchButton}
            onClick={handleSearchOpen}
          >
            <Icon
              name="search"
              size="20"
            />
          </ButtonBase>
        )}
        <Box
          aria-hidden="true"
          as="span"
          className={styles.Divider}
        />
        <MobileDialogButton
          onToggle={handleToggle}
          open={isOpen}
        />
      </Box>
      <Animate in={isOpen}>
        {(animateProps) => (
          <MobileDialog
            {...animateProps}
            aria-label={mode === 'search' ? t('Search') : t('Menu')}
            onClose={handleClose}
          >
            {mode === 'search' ? (
              <>
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
                  <Box className={styles.EmptyMessage}>
                    {t('No results found')}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Box className={styles.Scroll}>
                  <Box
                    aria-label={t('Menu')}
                    as="nav"
                    className={styles.LinkStack}
                  >
                    <LinkBase
                      className={styles.Link}
                      to="/"
                    >
                      {t('Home')}
                    </LinkBase>
                    <LinkBase
                      className={styles.Link}
                      to="/guide"
                    >
                      {t('Guide')}
                    </LinkBase>
                    <LinkBase
                      className={styles.Link}
                      to="/reference"
                    >
                      {t('Reference')}
                    </LinkBase>
                  </Box>
                </Box>
                <Box
                  as="footer"
                  className={styles.Footer}
                >
                  <IconLink
                    aria-label={t('View on GitHub')}
                    href="https://github.com/yapyak/yapyak"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Icon name="github" />
                  </IconLink>
                </Box>
              </>
            )}
          </MobileDialog>
        )}
      </Animate>
    </>
  );
}
