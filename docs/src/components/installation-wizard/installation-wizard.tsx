import { Box } from '#primitives/box';

import styles from './installation-wizard.module.css';
import { InstallationWizardGroup } from './installation-wizard-group';

const GROUPS = [
  'packageManager',
  'framework',
  'adapter',
  'translator',
];

export function InstallationWizard() {
  return (
    <Box
      as="section"
      className={styles.InstallationWizard}
    >
      {GROUPS.map((groupId) => (
        <InstallationWizardGroup
          group={groupId}
          key={groupId}
        />
      ))}
    </Box>
  );
}
