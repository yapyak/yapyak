import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './signature.module.css';

export interface ReferenceSymbolSignatureProps extends BoxProps<'section'> {
  html: string;
}

export function ReferenceSymbolSignature(props: ReferenceSymbolSignatureProps) {
  const { className, html, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolSignature, className]}
    >
      <Box
        as="h2"
        className={styles.Heading}
      >
        Signature
      </Box>
      <Box
        className={styles.Body}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Box>
  );
}
