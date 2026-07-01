import type { SwatchAccent } from '#components/swatch';

import { OptionMenu } from '#components/option-menu';
import { useOptionContext } from '#components/option-provider';
import { useMediaQuery } from '#hooks/use-media-query';
import { Box } from '#primitives/box';
import { RadioGroupBase } from '#primitives/radio';

import { visibleOptionsForGroup } from '../../adapter';
import styles from './installation-wizard-group.module.css';
import { InstallationWizardOption } from './installation-wizard-option';
import { doc } from 'virtual:doc-compiler';

export type InstallationWizardGroupProps = {
  group: string;
};

export function InstallationWizardGroup(props: InstallationWizardGroupProps) {
  const { group: groupId } = props;
  const { get, set } = useOptionContext();
  const group = doc.getOptionsGroup(groupId);
  const activeFramework = get('framework');
  const isCompact = useMediaQuery('(max-width: 640px)');

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

  const activeValue = get(groupId);

  const handleChange = (value: string) => {
    set(groupId, value);
  };

  return (
    <Box className={styles.InstallationWizardGroup}>
      <Box className={styles.Label}>{group.label}</Box>
      {isCompact ? (
        <OptionMenu group={groupId} />
      ) : (
        <RadioGroupBase
          aria-label={group.label}
          className={styles.RadioGroup}
          name={`installation-wizard-${groupId}`}
          onChange={handleChange}
          value={activeValue}
        >
          {options.map((option) => (
            <InstallationWizardOption
              accent={option.value as SwatchAccent}
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </RadioGroupBase>
      )}
    </Box>
  );
}
