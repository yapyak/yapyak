import type { OptionItem } from '@yapyak/doc-compiler';
import type { BoxProps } from '#primitives/box';

import { CheckIcon } from '#components/check-icon';
import { OptionAtom } from '#components/option-atom';
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
      onClick={() => onActivate(groupId, option.value)}
    >
      <OptionAtom
        label={option.label}
        value={option.value}
      />
      {active && (
        <Popover.OptionTrailing>
          <CheckIcon />
        </Popover.OptionTrailing>
      )}
    </Popover.Option>
  );
}
