import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './colophon-link.module.css';

export type ColophonLinkProps = BoxProps<'a'>;

export function ColophonLink(props: ColophonLinkProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="a"
      className={[
        styles.ColophonLink,
        className,
      ]}
      rel="noreferrer"
      target="_blank"
    />
  );
}
