import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './content-layout-content-content.module.css';

export type ContentLayoutContentContentProps = BoxProps;

export function ContentLayoutContentContent(
  props: ContentLayoutContentContentProps,
) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.ContentLayoutContentContent,
        className,
      ]}
    />
  );
}
