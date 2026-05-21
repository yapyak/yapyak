import type { Page } from '@yapyak/doc-extractor';
import type { BoxProps } from '#components/box';

import { BlockRenderer } from '#components/block-renderer';
import { Box } from '#components/box';

import styles from './page-article.module.css';

export interface PageArticleProps extends BoxProps<'article'> {
  page: Page;
}

export function PageArticle(props: PageArticleProps) {
  const { className, page, ...restProps } = props;

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
    </Box>
  );
}
