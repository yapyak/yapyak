import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './example-section.module.css';

export interface ReferenceSymbolExampleSectionProps extends BoxProps<'section'> {
  htmls: string[];
}

export function ReferenceSymbolExampleSection(
  props: ReferenceSymbolExampleSectionProps,
) {
  const { className, htmls, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolExampleSection, className]}
    >
      <Box
        as="h2"
        className={styles.Heading}
      >
        Examples
      </Box>
      {htmls.map((html, index) => (
        <Box
          className={styles.Body}
          dangerouslySetInnerHTML={{ __html: html }}
          key={index}
        />
      ))}
    </Box>
  );
}
