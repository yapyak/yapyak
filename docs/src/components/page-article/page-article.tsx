import type { Page } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { BlockRenderer } from '#components/block-renderer';
import { ContentPagination } from '#components/content-pagination';
import { Box } from '#primitives/box';

import styles from './page-article.module.css';
import { doc } from 'virtual:doc-compiler';

export type PageArticleProps = BoxProps<'article'> & {
  page: Page;
};

export function PageArticle(props: PageArticleProps) {
  const { className, page, ...restProps } = props;
  const { nextPage, nextParentLabel, previousPage, previousParentLabel } =
    doc.findAdjacentPages(page);

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
        <BlockRenderer blocks={page.blocks} />
      </Box>
      {(nextPage !== undefined || previousPage !== undefined) && (
        <Box
          as="footer"
          className={styles.Footer}
        >
          <ContentPagination
            nextPage={nextPage}
            nextParentLabel={nextParentLabel}
            previousPage={previousPage}
            previousParentLabel={previousParentLabel}
          />
        </Box>
      )}
    </Box>
  );
}
