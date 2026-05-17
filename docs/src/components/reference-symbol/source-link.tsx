import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './source-link.module.css';

export interface ReferenceSymbolSourceLinkProps extends BoxProps<'footer'> {
  file: string;
  line: number;
}

export function ReferenceSymbolSourceLink(
  props: ReferenceSymbolSourceLinkProps,
) {
  const { className, file, line, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="footer"
      className={[styles.ReferenceSymbolSourceLink, className]}
    >
      <Box
        as="span"
        className={styles.PathText}
      >
        {file}:{line}
      </Box>
    </Box>
  );
}
