import type { HTMLAttributes, ReactElement } from 'react';

import styles from './header.module.css';

export interface ArticleHeaderProps extends HTMLAttributes<HTMLElement> {
  description?: string;
  title: string;
}

export function ArticleHeader(props: ArticleHeaderProps): ReactElement {
  const { title, description, className, ...restProps } = props;
  const merged = className
    ? `${styles.ArticleHeader} ${className}`
    : styles.ArticleHeader;
  return (
    <header
      {...restProps}
      className={merged}
    >
      <h1 className={styles.Title}>{title}</h1>
      {description !== undefined && description !== '' ? (
        <p className={styles.Description}>{description}</p>
      ) : null}
    </header>
  );
}
