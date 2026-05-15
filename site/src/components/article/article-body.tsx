import type { HTMLAttributes, ReactElement } from 'react';

import styles from './article-body.module.css';

export interface ArticleBodyProps extends HTMLAttributes<HTMLDivElement> {
  html: string;
}

export function ArticleBody(props: ArticleBodyProps): ReactElement {
  const { html, className, ...restProps } = props;
  const merged = className
    ? `${styles.ArticleBody} ${className}`
    : styles.ArticleBody;
  return (
    <div
      {...restProps}
      className={merged}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered markdown
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
