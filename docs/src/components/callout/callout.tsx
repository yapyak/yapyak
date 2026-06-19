import type { BoxProps } from '#components/box';

import { t } from 'yapyak';

import { Box } from '#components/box';

import styles from './callout.module.css';

export type CalloutVariant = 'tip' | 'info' | 'warning' | 'danger';

export type CalloutProps = BoxProps<'aside'> & {
  title?: string;
  variant: CalloutVariant;
};

export function Callout(props: CalloutProps) {
  const { children, className, title, variant, ...restProps } = props;
  const defaultTitles: Record<CalloutVariant, string> = {
    danger: t('Danger'),
    info: t('Info'),
    tip: t('Tip'),
    warning: t('Warning'),
  };
  const resolvedTitle = title ?? defaultTitles[variant];

  return (
    <Box
      {...restProps}
      as="aside"
      className={[
        styles.Callout,
        className,
      ]}
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
