import type { RadioBaseProps } from '#primitives/radio';
import type { SwatchAccent } from '../swatch';

import { RadioBase } from '#primitives/radio';

import { Swatch } from '../swatch';
import styles from './installation-wizard-option.module.css';

export type InstallationWizardOptionProps = RadioBaseProps & {
  accent: SwatchAccent;
  label: string;
};

export function InstallationWizardOption(props: InstallationWizardOptionProps) {
  const { accent, className, label, ...restProps } = props;

  return (
    <RadioBase
      {...restProps}
      className={[
        styles.InstallationWizardOption,
        className,
      ]}
    >
      <Swatch accent={accent} />
      {label}
    </RadioBase>
  );
}
