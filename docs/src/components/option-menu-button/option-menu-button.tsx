import type { ButtonBaseProps } from '#primitives/button';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { Icon } from '../icon';
import styles from './option-menu-button.module.css';
import { OptionMenuButtonOption } from './option-menu-button-option';

type OptionMenuButtonItem = {
  label: string;
  value: string;
};

export type OptionMenuButtonProps = ButtonBaseProps & {
  group: string;
  label: string;
  options: OptionMenuButtonItem[];
  value: string;
};

export function OptionMenuButton(props: OptionMenuButtonProps) {
  const { className, group, label, options, value, ...restProps } = props;

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
      {options.map((option) => (
        <OptionMenuButtonOption
          active={option.value === value}
          group={group}
          key={option.value}
          label={option.label}
          value={option.value}
        />
      ))}
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
