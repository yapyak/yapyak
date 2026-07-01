import type { SwatchAccent } from '#components/swatch';

import { t } from 'yapyak';

import { ChevronIcon } from '#components/chevron-icon';
import { Menu, MenuTrigger } from '#components/menu';
import { useOptionContext } from '#components/option-provider';
import { Swatch } from '#components/swatch';
import { Box } from '#primitives/box';
import { ButtonBase } from '#primitives/button';

import { visibleOptionsForGroup } from '../../adapter';
import styles from './option-menu.module.css';
import { doc } from 'virtual:doc-compiler';

export type OptionMenuProps = {
  group: string;
};

export function OptionMenu(props: OptionMenuProps) {
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
        <Menu
          {...menuProps}
          alignment="center"
          aria-label={group.label}
          className={styles.OptionMenu}
          placement="bottom"
        >
          <Menu.RadioGroup
            aria-label={group.label}
            onChange={handleChange}
            value={activeValue}
          >
            {options.map((option) => (
              <Menu.RadioItem
                accent={option.value as SwatchAccent}
                key={option.value}
                value={option.value}
              >
                {option.label}
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu>
      )}
    >
      {(triggerProps) => (
        <ButtonBase
          {...triggerProps}
          aria-label={t('Change {label}', {
            label: group.label,
          })}
          className={styles.Trigger}
        >
          <Swatch accent={activeValue as SwatchAccent} />
          <Box
            as="span"
            className={styles.Label}
          >
            {activeOption.label}
          </Box>
          <Box
            aria-hidden={true}
            as="span"
            className={styles.Chevron}
          >
            <ChevronIcon direction="down" />
          </Box>
        </ButtonBase>
      )}
    </MenuTrigger>
  );
}
