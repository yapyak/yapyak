import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './content-layout-content.module.css';

export type ContentLayoutContentProps = BoxProps<'main'>;

export function ContentLayoutContent(props: ContentLayoutContentProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="main"
      className={[
        styles.ContentLayoutContent,
        className,
      ]}
    />
  );
}
