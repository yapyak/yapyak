import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './header.module.css';

export interface ArticleHeaderProps extends BoxProps<'header'> {
  description?: string;
  title: string;
}

export function ArticleHeader(props: ArticleHeaderProps) {
  const { className, description, title, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="header"
      className={[styles.ArticleHeader, className]}
    >
      <Box
        as="h1"
        className={styles.Title}
      >
        {title}
      </Box>
      {description ? (
        <Box
          as="p"
          className={styles.Description}
        >
          {description}
        </Box>
      ) : null}
    </Box>
  );
}
