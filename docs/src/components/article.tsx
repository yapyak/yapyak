import type { BoxProps } from '#components/box';
import type { Article as ArticleData } from '#lib/article';

import { Box } from '#components/box';
import { MarkdocRenderer } from '#components/markdoc-renderer';

import styles from './article.module.css';

export interface ArticleProps extends BoxProps<'article'> {
  article: ArticleData;
}

export function Article(props: ArticleProps) {
  const { article, className, ...restProps } = props;

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
          {article.title}
        </Box>
        {article.description && (
          <Box
            as="p"
            className={styles.DescriptionParagraph}
          >
            {article.description}
          </Box>
        )}
      </Box>
      <Box className={styles.Body}>
        <MarkdocRenderer tree={article.tree} />
      </Box>
    </Box>
  );
}
