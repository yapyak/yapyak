import { Box } from '#primitives/box';

import styles from './installation-wizard.module.css';
import { InstallationWizardRow } from './installation-wizard-row';

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
        <InstallationWizardRow
          group={groupId}
          key={groupId}
        />
      ))}
    </Box>
  );
}
