import type { BoxProps } from '#components/box';

import { Box } from '#components/box';

import styles from './callout.module.css';

export type CalloutVariant = 'tip' | 'info' | 'warning' | 'danger';

export interface CalloutProps extends Omit<BoxProps<'aside'>, 'title'> {
  title: string | null;
  variant: CalloutVariant;
}

const DEFAULT_TITLES: Record<CalloutVariant, string> = {
  danger: 'Danger',
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
};

export function Callout(props: CalloutProps) {
  const { children, className, title, variant, ...restProps } = props;
  const resolvedTitle = title ?? DEFAULT_TITLES[variant];

  return (
    <Box
      {...restProps}
      as="aside"
      className={[styles.Callout, className]}
      data-variant={variant}
    >
      <Box
        as="span"
        className={styles.TitleText}
      >
        {resolvedTitle}
      </Box>
      <Box className={styles.BodyStack}>{children}</Box>
    </Box>
  );
}
