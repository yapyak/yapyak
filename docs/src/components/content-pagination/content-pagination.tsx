import type { Page } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';

import { Box } from '#components/box';

import styles from './content-pagination.module.css';

export type ContentPaginationProps = BoxProps<'nav'> & {
  nextPage?: Page;
  nextParentLabel?: string;
  previousPage?: Page;
  previousParentLabel?: string;
};

export function ContentPagination(props: ContentPaginationProps) {
  const {
    className,
    nextPage,
    nextParentLabel,
    previousPage,
    previousParentLabel,
    ...restProps
  } = props;

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
          {previousParentLabel !== undefined && (
            <Box
              as="span"
              className={styles.ParentText}
            >
              {previousParentLabel}
            </Box>
          )}
          <Box
            as="span"
            className={styles.TitleText}
          >
            {previousPage.title}
          </Box>
          {previousPage.description && (
            <Box
              as="span"
              className={styles.DescriptionText}
            >
              {previousPage.description}
            </Box>
          )}
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {nextPage ? (
        <Link
          className={styles.NextCard}
          to={nextPage.href}
        >
          {nextParentLabel !== undefined && (
            <Box
              as="span"
              className={styles.ParentText}
            >
              {nextParentLabel}
            </Box>
          )}
          <Box
            as="span"
            className={styles.TitleText}
          >
            {nextPage.title}
          </Box>
          {nextPage.description && (
            <Box
              as="span"
              className={styles.DescriptionText}
            >
              {nextPage.description}
            </Box>
          )}
        </Link>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
