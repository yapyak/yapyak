import type { BoxProps } from '#primitives/box';
import type { IconName } from './icon-glyph';

import { Box } from '#primitives/box';

import styles from './icon.module.css';
import { IconGlyph } from './icon-glyph';

export type IconSize = '12' | '14' | '16' | '20' | '24';

export type IconProps = BoxProps<'i'> & {
  name: IconName;
  size?: IconSize;
};

export function Icon(props: IconProps) {
  const { className, name, size, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="i"
      className={[
        styles.Icon,
        className,
      ]}
      data-size={size}
    >
      <IconGlyph name={name} />
    </Box>
  );
}
