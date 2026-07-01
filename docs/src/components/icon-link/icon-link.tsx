import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './icon-link.module.css';

export type IconLinkProps = BoxProps<'a'>;

export function IconLink(props: IconLinkProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="a"
      className={[
        styles.IconLink,
        className,
      ]}
    />
  );
}
