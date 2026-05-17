import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './example-list.module.css';

export interface ReferenceSymbolExampleListProps extends BoxProps<'section'> {
  htmls: string[];
}

export function ReferenceSymbolExampleList(
  props: ReferenceSymbolExampleListProps,
) {
  const { className, htmls, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.ReferenceSymbolExampleList, className]}
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
