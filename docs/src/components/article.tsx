import type { BoxProps } from '#components/box';
import type { Article as ArticleData } from '#lib/article';

import { Box } from '#components/box';

import { ArticleBody } from './article/body';
import { ArticleHeader } from './article/header';
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
      <ArticleHeader
        description={article.description}
        title={article.title}
      />
      <ArticleBody tree={article.tree} />
    </Box>
  );
}
