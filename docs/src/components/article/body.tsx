import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './body.module.css';

export interface ArticleBodyProps extends BoxProps {
  html: string;
}

export function ArticleBody(props: ArticleBodyProps) {
  const { className, html, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.ArticleBody, className]}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
