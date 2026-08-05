import type { ButtonBaseProps } from '#primitives/button';
import type { SwatchAccent } from '../swatch';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { Icon } from '../icon';
import { Swatch } from '../swatch';
import styles from './option-menu-button.module.css';

export type OptionMenuButtonProps = ButtonBaseProps & {
  accent: SwatchAccent;
  label: string;
};

export function OptionMenuButton(props: OptionMenuButtonProps) {
  const { accent, children, className, label, ...restProps } = props;

  return (
    <ButtonBase
      {...restProps}
      aria-label={t('Change {label}', {
        label,
      })}
      className={[
        styles.OptionMenuButton,
        className,
      ]}
    >
      <Swatch accent={accent} />
      <Box
        as="span"
        className={styles.LabelText}
      >
        {children}
      </Box>
      <Box
        aria-hidden={true}
        as="span"
        className={styles.Chevron}
      >
        <Icon name="chevron" />
      </Box>
    </ButtonBase>
  );
}
