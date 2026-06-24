import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { OptionDot } from '#components/option-dot';

import styles from './option-atom.module.css';

export type OptionAtomProps = BoxProps & {
  label: string;
  value: string;
};

export function OptionAtom(props: OptionAtomProps) {
  const { className, label, value, ...restProps } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.OptionAtom,
        className,
      ]}
      data-option-value={value}
    >
      <OptionDot />
      <Box
        as="span"
        className={styles.Text}
      >
        {label}
      </Box>
    </Box>
  );
}
