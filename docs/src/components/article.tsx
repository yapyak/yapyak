import type { HTMLAttributes, ReactElement, ReactNode } from 'react';

import styles from './article.module.css';
import { ArticleBody } from './article/body';
import { ArticleHeader } from './article/header';

export interface ArticleProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export declare namespace Article {
  let Header: typeof ArticleHeader;
  let Body: typeof ArticleBody;
}

export function Article(props: ArticleProps): ReactElement {
  const { children, className, ...restProps } = props;
  const merged = className ? `${styles.Article} ${className}` : styles.Article;
  return (
    <article
      {...restProps}
      className={merged}
    >
      {children}
    </article>
  );
}

Article.Header = ArticleHeader;
Article.Body = ArticleBody;
