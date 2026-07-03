import type { ReactNode } from 'react';
import type { SearchResult } from '#lib/search-result';

import { Fragment } from 'react';

import { Icon } from '#components/icon';
import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './command-palette-item.module.css';

export type CommandPaletteItemProps = {
  active: boolean;
  id: string;
  result: SearchResult;
};

export function CommandPaletteItem(props: CommandPaletteItemProps) {
  const { active, id, result } = props;
  const { entry, ranges } = result;

  const hashIndex = entry.href.indexOf('#');
  const pathname = hashIndex < 0 ? entry.href : entry.href.slice(0, hashIndex);
  const hash = hashIndex < 0 ? undefined : entry.href.slice(hashIndex + 1);

  return (
    <Box
      aria-selected={active}
      as="li"
      className={styles.CommandPaletteItem}
      data-active={active}
      id={id}
      role="option"
    >
      <LinkBase
        className={styles.Link}
        hash={hash}
        tabIndex={-1}
        to={pathname}
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
      </LinkBase>
    </Box>
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
