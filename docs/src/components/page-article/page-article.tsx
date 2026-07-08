import type { Block, Page } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { BlockRenderer } from '#components/block-renderer';
import { PaginationNavigation } from '#components/pagination-navigation';
import { Box } from '#primitives/box';

import styles from './page-article.module.css';
import { doc } from 'virtual:doc-compiler';

export type PageArticleProps = BoxProps<'article'> & {
  blocks: Block[];
  page: Page;
};

export function PageArticle(props: PageArticleProps) {
  const { blocks, className, page, ...restProps } = props;
  const pagination = doc.getPagination(page);

  return (
    <Box
      {...restProps}
      as="article"
      className={[
        styles.PageArticle,
        className,
      ]}
    >
      <Box
        as="header"
        className={styles.Header}
      >
        <Box
          as="h1"
          className={styles.TitleHeading}
        >
          {page.title}
        </Box>
        {page.description && (
          <Box
            as="p"
            className={styles.DescriptionParagraph}
          >
            {page.description}
          </Box>
        )}
      </Box>
      <Box className={styles.Body}>
        <BlockRenderer blocks={blocks} />
      </Box>
      {(pagination.previousPage || pagination.nextPage) && (
        <Box
          as="footer"
          className={styles.Footer}
        >
          <PaginationNavigation pagination={pagination} />
        </Box>
      )}
    </Box>
  );
}
