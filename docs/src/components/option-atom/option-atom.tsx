import type { SwatchAccent } from '#components/swatch';
import type { BoxProps } from '#primitives/box';

import { Swatch } from '#components/swatch';
import { Box } from '#primitives/box';

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
    >
      <Swatch accent={value as SwatchAccent} />
      <Box
        as="span"
        className={styles.Text}
      >
        {label}
      </Box>
    </Box>
  );
}
