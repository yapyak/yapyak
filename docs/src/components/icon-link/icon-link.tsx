import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './icon-link.module.css';

export interface IconLinkProps extends BoxProps<'a'> {}

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
