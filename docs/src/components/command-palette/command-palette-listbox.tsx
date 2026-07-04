import type { ReactNode } from 'react';
import type { SearchResult } from '#lib/search-result';

import { Fragment } from 'react';

import { Icon } from '#components/icon';
import { Box } from '#primitives/box';
import { ListboxBase, ListboxBaseOption } from '#primitives/listbox';

import styles from './command-palette-listbox.module.css';

export type CommandPaletteListboxProps = {
  highlightedHref: null | string;
  id: string;
  onHighlightChange: (href: null | string) => void;
  onSelect: (href: string) => void;
  results: SearchResult[];
};

export function CommandPaletteListbox(props: CommandPaletteListboxProps) {
  const { highlightedHref, id, onHighlightChange, onSelect, results } = props;

  return (
    <ListboxBase
      className={styles.CommandPaletteListbox}
      highlight={highlightedHref}
      id={id}
      onChange={onSelect}
      onHighlightChange={onHighlightChange}
      tabIndex={-1}
    >
      {results.map((result) => {
        const { entry, ranges } = result;

        return (
          <ListboxBaseOption
            className={styles.Option}
            key={entry.href}
            value={entry.href}
          >
            <Icon
              className={styles.LeadingIcon}
              name={entry.kind === 'heading' ? 'hash' : 'markdown'}
            />
            <Box
              as="span"
              className={styles.Stack}
            >
              {entry.breadcrumb.length > 0 && (
                <Box
                  as="span"
                  className={styles.BreadcrumbText}
                >
                  {entry.breadcrumb.join(' › ')}
                </Box>
              )}
              <Box
                as="span"
                className={styles.TitleText}
              >
                {getTitleParts(entry.title, ranges)}
              </Box>
            </Box>
          </ListboxBaseOption>
        );
      })}
    </ListboxBase>
  );
}

function getTitleParts(title: string, ranges: SearchResult['ranges']) {
  if (ranges.length === 0) {
    return title;
  }
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      parts.push(
        <Fragment key={cursor}>{title.slice(cursor, start)}</Fragment>,
      );
    }
    parts.push(
      <Box
        as="span"
        className={styles.MatchText}
        key={start}
      >
        {title.slice(start, end)}
      </Box>,
    );
    cursor = end;
  }
  if (cursor < title.length) {
    parts.push(<Fragment key={cursor}>{title.slice(cursor)}</Fragment>);
  }
  return parts;
}
