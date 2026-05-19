import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

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
      <Box as="strong">{t('Deprecated.')}</Box> {message}
    </Box>
  );
}
