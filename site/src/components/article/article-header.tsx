import type { HTMLAttributes, ReactElement } from 'react';
import styles from './article-header.module.css';

export interface ArticleHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
}

export function ArticleHeader(props: ArticleHeaderProps): ReactElement {
  const { title, description, className, ...restProps } = props;
  const merged = className
    ? `${styles.ArticleHeader} ${className}`
    : styles.ArticleHeader;
  return (
    <header {...restProps} className={merged}>
      <h1 className={styles.Title}>{title}</h1>
      {description !== undefined && description !== '' ? (
        <p className={styles.Description}>{description}</p>
      ) : null}
    </header>
  );
}
