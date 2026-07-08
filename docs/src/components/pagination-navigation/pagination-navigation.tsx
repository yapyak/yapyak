import type { Pagination } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './pagination-navigation.module.css';

export type PaginationNavigationProps = BoxProps<'nav'> & {
  pagination: Pagination;
};

export function PaginationNavigation(props: PaginationNavigationProps) {
  const { className, pagination, ...restProps } = props;
  const { nextPageMeta, previousPageMeta } = pagination;
  const previousSection = previousPageMeta?.breadcrumbs.at(-1);
  const nextSection = nextPageMeta?.breadcrumbs.at(-1);

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.PaginationNavigation,
        className,
      ]}
    >
      {previousPageMeta ? (
        <LinkBase
          className={styles.PreviousLink}
          to={previousPageMeta.href}
        >
          {previousSection !== undefined && (
            <Box
              as="span"
              className={styles.ParentText}
            >
              {previousSection}
            </Box>
          )}
          <Box
            as="span"
            className={styles.TitleText}
          >
            {previousPageMeta.title}
          </Box>
          {previousPageMeta.description && (
            <Box
              as="span"
              className={styles.DescriptionText}
            >
              {previousPageMeta.description}
            </Box>
          )}
        </LinkBase>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {nextPageMeta ? (
        <LinkBase
          className={styles.NextLink}
          to={nextPageMeta.href}
        >
          {nextSection !== undefined && (
            <Box
              as="span"
              className={styles.ParentText}
            >
              {nextSection}
            </Box>
          )}
          <Box
            as="span"
            className={styles.TitleText}
          >
            {nextPageMeta.title}
          </Box>
          {nextPageMeta.description && (
            <Box
              as="span"
              className={styles.DescriptionText}
            >
              {nextPageMeta.description}
            </Box>
          )}
        </LinkBase>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
