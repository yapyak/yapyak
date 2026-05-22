import type { Page } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { BlockRenderer } from '#components/block-renderer';
import { Box } from '#components/box';
import { ContentPagination } from '#components/content-pagination';

import styles from './page-article.module.css';
import { doc } from 'virtual:doc-extractor';

export interface PageArticleProps extends BoxProps<'article'> {
  page: Page;
}

export function PageArticle(props: PageArticleProps) {
  const { className, page, ...restProps } = props;
  const { nextPage, previousPage } = doc.findAdjacentPages(page);

  return (
    <Box
      {...restProps}
      as="article"
      className={[styles.PageArticle, className]}
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
      {(nextPage || previousPage) && (
        <Box
          as="footer"
          className={styles.Footer}
        >
          <ContentPagination
            nextPage={nextPage}
            previousPage={previousPage}
          />
        </Box>
      )}
    </Box>
  );
}
