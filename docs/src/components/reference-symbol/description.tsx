import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './description.module.css';

export interface ReferenceSymbolDescriptionProps extends BoxProps<'section'> {
  html: string;
}

export function ReferenceSymbolDescription(
  props: ReferenceSymbolDescriptionProps,
) {
  const { className, html, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolDescription, className]}
    >
      <Box
        className={styles.Body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Box>
  );
}
