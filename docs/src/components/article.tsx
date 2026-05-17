import type { BoxProps } from '#components/box';
import type { Page } from '#lib/markdoc';

import { Box } from '#components/box';
import { MarkdocRenderer } from '#components/markdoc-renderer';

import styles from './article.module.css';

export interface ArticleProps extends BoxProps<'article'> {
  page: Page;
}

export function Article(props: ArticleProps) {
  const { className, page, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="article"
      className={[styles.Article, className]}
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
        <MarkdocRenderer tree={page.tree} />
      </Box>
    </Box>
  );
}
