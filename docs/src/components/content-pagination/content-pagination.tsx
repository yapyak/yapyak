import type { Page } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';
import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './content-pagination.module.css';

export interface ContentPaginationProps extends BoxProps<'nav'> {
  nextPage?: Page;
  previousPage?: Page;
}

export function ContentPagination(props: ContentPaginationProps) {
  const { className, nextPage, previousPage, ...restProps } = props;

  if (!nextPage && !previousPage) {
    return null;
  }

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.ContentPagination,
        className,
      ]}
    >
      {previousPage ? (
        <Link
          className={styles.PreviousCard}
          to={previousPage.href}
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
            {previousPage.title}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {nextPage ? (
        <Link
          className={styles.NextCard}
          to={nextPage.href}
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
            {nextPage.title}
          </Box>
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
