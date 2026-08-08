import type { BoxProps } from '#primitives/box';
import type { SwatchAccent } from '../swatch';

import { Box } from '#primitives/box';

import { Swatch } from '../swatch';
import styles from './option-menu-button-option.module.css';

export type OptionMenuButtonOptionProps = BoxProps<'span'> & {
  active: boolean;
  group: string;
  label: string;
  value: string;
};

export function OptionMenuButtonOption(props: OptionMenuButtonOptionProps) {
  const { active, className, group, label, value, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="span"
      className={[
        styles.OptionMenuButtonOption,
        className,
      ]}
      data-active={active}
      data-option-group={group}
      data-option-value={value}
    >
      <Swatch accent={value as SwatchAccent} />
      <Box
        as="span"
        className={styles.LabelText}
      >
        {label}
      </Box>
    </Box>
  );
}
