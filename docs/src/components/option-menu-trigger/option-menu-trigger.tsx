import type { SwatchAccent } from '../swatch';

import { visibleOptionsForGroup } from '#lib/adapter';

import { MenuTrigger } from '../menu';
import { OptionMenu } from '../option-menu';
import { OptionMenuButton } from '../option-menu-button';
import { useOptionContext } from '../option-provider';
import { doc } from 'virtual:docs-compiler';

export type OptionMenuTriggerProps = {
  group: string;
};

export function OptionMenuTrigger(props: OptionMenuTriggerProps) {
  const { group: groupId } = props;
  const { get, set } = useOptionContext();
  const group = doc.getOptionsGroup(groupId);
  const activeValue = get(groupId);
  const activeFramework = get('framework');

  if (group === undefined) {
    return null;
  }

  const options = visibleOptionsForGroup(
    groupId,
    group.options,
    activeFramework,
  );
  if (options.length < 2) {
    return null;
  }

  const activeOption = options.find((option) => option.value === activeValue);
  if (activeOption === undefined) {
    return null;
  }

  const handleChange = (value: string) => {
    set(groupId, value);
  };

  return (
    <MenuTrigger
      menu={(menuProps) => (
        <OptionMenu
          {...menuProps}
          label={group.label}
          onChange={handleChange}
          options={options}
          value={activeValue}
        />
      )}
    >
      {(triggerProps) => (
        <OptionMenuButton
          {...triggerProps}
          accent={activeValue as SwatchAccent}
          label={group.label}
        >
          {activeOption.label}
        </OptionMenuButton>
      )}
    </MenuTrigger>
  );
}
