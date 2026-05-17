import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './examples.module.css';

export interface ReferenceSymbolExamplesProps extends BoxProps<'section'> {
  htmls: string[];
}

export function ReferenceSymbolExamples(props: ReferenceSymbolExamplesProps) {
  const { className, htmls, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolExamples, className]}
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
