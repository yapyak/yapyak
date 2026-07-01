import type { ReactElement } from 'react';
import type { BoxProps } from '#primitives/box';

import { Box } from '#primitives/box';

import styles from './backdrop.module.css';

export type BackdropProps = BoxProps & {
  opaque?: boolean;
};

export function Backdrop(props: BackdropProps): ReactElement {
  const { className, opaque = false, ...restProps } = props;

  return (
    <Box
      {...restProps}
      aria-hidden={true}
      className={[
        styles.Backdrop,
        className,
      ]}
      data-opaque={opaque}
    />
  );
}
