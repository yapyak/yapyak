import type { OptionItem } from '@yapyak/doc-compiler';
import type { BoxProps } from '#components/box';

import { CheckIcon } from '#components/check-icon';
import { OptionDot } from '#components/option-dot';
import { Popover } from '#components/popover';

export type OptionPickListItemProps = BoxProps<'button'> & {
  active: boolean;
  groupId: string;
  onActivate: (groupId: string, value: string) => void;
  option: OptionItem;
};

export function OptionPickListItem(props: OptionPickListItemProps) {
  const { active, groupId, onActivate, option, ...restProps } = props;

  return (
    <Popover.Option
      {...restProps}
      aria-pressed={active}
      data-active={active}
      data-option-value={option.value}
      onClick={() => onActivate(groupId, option.value)}
    >
      <OptionDot />
      <Popover.OptionLabel>{option.label}</Popover.OptionLabel>
      {active && (
        <Popover.OptionTrailing>
          <CheckIcon />
        </Popover.OptionTrailing>
      )}
    </Popover.Option>
  );
}
