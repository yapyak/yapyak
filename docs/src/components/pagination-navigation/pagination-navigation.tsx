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
  const { nextPage, previousPage } = pagination;
  const previousSection = previousPage?.breadcrumbs.at(-1);
  const nextSection = nextPage?.breadcrumbs.at(-1);

  return (
    <Box
      {...restProps}
      as="nav"
      className={[
        styles.PaginationNavigation,
        className,
      ]}
    >
      {previousPage ? (
        <LinkBase
          className={styles.PreviousLink}
          to={previousPage.href}
        >
          {previousSection && (
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
        </LinkBase>
      ) : (
        <Box className={styles.Spacer} />
      )}
      {nextPage ? (
        <LinkBase
          className={styles.NextLink}
          to={nextPage.href}
        >
          {nextSection && (
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
        </LinkBase>
      ) : (
        <Box className={styles.Spacer} />
      )}
    </Box>
  );
}
