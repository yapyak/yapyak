import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import { ArticleBody } from './article/body';
import { ArticleHeader } from './article/header';
import styles from './article.module.css';

export interface ArticleProps extends BoxProps<'article'> {}

export function Article(props: ArticleProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="article"
      className={[styles.Article, className]}
    />
  );
}

Article.Body = ArticleBody;
Article.Header = ArticleHeader;
