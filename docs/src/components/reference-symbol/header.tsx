import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './header.module.css';

export interface ReferenceSymbolHeaderProps extends BoxProps<'header'> {
  kind: string;
  module: string;
  name: string;
}

export function ReferenceSymbolHeader(props: ReferenceSymbolHeaderProps) {
  const { className, kind, module, name, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="header"
      className={[styles.ReferenceSymbolHeader, className]}
    >
      <Box
        as="span"
        className={styles.Eyebrow}
      >
        {module}{' '}
        <Box
          as="span"
          className={styles.EyebrowDot}
        >
          ·
        </Box>{' '}
        {kind}
      </Box>
      <Box
        as="h1"
        className={styles.Heading}
      >
        {name}
      </Box>
    </Box>
  );
}
