import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

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
