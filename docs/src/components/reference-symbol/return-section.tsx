import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './return-section.module.css';

export interface ReferenceSymbolReturnSectionProps extends BoxProps<'section'> {
  description?: string;
  type: string;
}

export function ReferenceSymbolReturnSection(
  props: ReferenceSymbolReturnSectionProps,
) {
  const { className, description, type, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolReturnSection, className]}
    >
      <Box
        as="h2"
        className={styles.Heading}
      >
        Returns
      </Box>
      <Box
        as="p"
        className={styles.Line}
      >
        <Box as="code">{type}</Box>
        {description && ` — ${description}`}
      </Box>
    </Box>
  );
}
