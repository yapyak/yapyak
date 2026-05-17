import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './deprecated.module.css';

export interface ReferenceSymbolDeprecatedProps extends BoxProps {
  message: string;
}

export function ReferenceSymbolDeprecated(
  props: ReferenceSymbolDeprecatedProps,
) {
  const { className, message, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[styles.ReferenceSymbolDeprecated, className]}
    >
      <Box as="strong">Deprecated.</Box> {message}
    </Box>
  );
}
