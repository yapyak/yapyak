import type { BoxProps } from '#components/box';
import type { MarkdocNode } from '#lib/markdoc';

import { Box } from '#components/box';
import { MarkdocRenderer } from '#components/markdoc-renderer';

import styles from './body.module.css';

export interface ArticleBodyProps extends BoxProps {
  tree: MarkdocNode[];
}

export function ArticleBody(props: ArticleBodyProps) {
  const { className, tree, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.ArticleBody, className]}
    >
      <MarkdocRenderer tree={tree} />
    </Box>
  );
}
