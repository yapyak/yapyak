import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-layout-outline.module.css';

export interface ContentLayoutOutlineProps extends BoxProps<'aside'> {}

export function ContentLayoutOutline(props: ContentLayoutOutlineProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="aside"
      className={[
        styles.ContentLayoutOutline,
        className,
      ]}
    />
  );
}
