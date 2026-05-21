import type { SidebarLink } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';
import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './content-pagination.module.css';

export interface ContentPaginationProps extends BoxProps<'nav'> {
  next: SidebarLink | null;
  previous: SidebarLink | null;
}

export function ContentPagination(props: ContentPaginationProps) {
  const { className, next, previous, ...restProps } = props;

  if (!next && !previous) {
    return null;
  }

  return (
    <Box
      {...restProps}
      as="nav"
      className={[styles.ContentPagination, className]}
    >
      {previous ? (
        <Link
          className={styles.PreviousCard}
          to={previous.href}
        >
          <Box
            as="span"
            className={styles.LabelText}
          >
            {t('Previous')}
          </Box>
          <Box
            as="span"
            className={styles.TitleText}
          >
            {previous.label}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {next ? (
        <Link
          className={styles.NextCard}
          to={next.href}
        >
          <Box
            as="span"
            className={styles.LabelText}
          >
            {t('Next')}
          </Box>
          <Box
            as="span"
            className={styles.TitleText}
          >
            {next.label}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
