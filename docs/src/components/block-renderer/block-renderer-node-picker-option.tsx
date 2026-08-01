import type { ButtonBaseProps } from '#primitives/button';
import type { SwatchAccent } from '../swatch';

import { ButtonBase } from '#primitives/button';

import { Swatch } from '../swatch';
import styles from './block-renderer-node-picker.module.css';

export type BlockRendererNodePickerOptionProps = ButtonBaseProps & {
  active: boolean;
  groupId: string;
  label: string;
  onActivate: (groupId: string, value: string) => void;
  value: string;
};

export function BlockRendererNodePickerOption(
  props: BlockRendererNodePickerOptionProps,
) {
  const { active, groupId, label, onActivate, value, ...restProps } = props;

  const handleClick = () => {
    onActivate(groupId, value);
  };

  return (
    <ButtonBase
      {...restProps}
      aria-checked={active}
      className={styles.Option}
      data-active={active}
      onClick={handleClick}
      role="radio"
    >
      <Swatch accent={value as SwatchAccent} />
      {label}
    </ButtonBase>
  );
}
