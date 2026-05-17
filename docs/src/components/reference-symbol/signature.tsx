import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { CodeBlock } from '#components/code-block';

import styles from './signature.module.css';

export interface ReferenceSymbolSignatureProps extends BoxProps<'section'> {
  source: string;
}

export function ReferenceSymbolSignature(props: ReferenceSymbolSignatureProps) {
  const { className, source, ...restProps } = props;

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
      <CodeBlock
        language="ts"
        source={source}
      />
    </Box>
  );
}
