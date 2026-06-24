import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './popover.module.css';
import { PopoverEyebrow } from './popover-eyebrow';
import { PopoverOption } from './popover-option';
import { PopoverOptionLabel } from './popover-option-label';
import { PopoverOptionTrailing } from './popover-option-trailing';

export type PopoverAlignment = 'center' | 'end' | 'start';

export type PopoverProps = BoxProps & {
  align?: PopoverAlignment;
  anchorName: string;
  id: string;
};

export function Popover(props: PopoverProps) {
  const {
    align = 'end',
    anchorName,
    children,
    className,
    id,
    ...restProps
  } = props;

  return (
    <Box
      {...restProps}
      className={[
        styles.Popover,
        className,
      ]}
      data-align={align}
      id={id}
      popover="auto"
      style={{
        '--popover-anchor': anchorName,
      }}
    >
      <Box
        aria-hidden="true"
        className={styles.GrainOverlay}
      />
      {children}
    </Box>
  );
}

Popover.Option = PopoverOption;
Popover.OptionLabel = PopoverOptionLabel;
Popover.OptionTrailing = PopoverOptionTrailing;
Popover.Eyebrow = PopoverEyebrow;
