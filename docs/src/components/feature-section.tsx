import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { FEATURES } from '#utils/features';

import { FeatureSectionItem } from './feature-section/item';
import styles from './feature-section.module.css';

export interface FeatureSectionProps extends BoxProps<'section'> {}

export function FeatureSection(props: FeatureSectionProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.FeatureSection, className]}
    >
      <Box
        aria-hidden="true"
        className={styles.Divider}
      />
      <Box
        as="ol"
        className={styles.List}
      >
        {FEATURES.map((feature) => (
          <FeatureSectionItem
            feature={feature}
            key={feature.number}
          />
        ))}
      </Box>
    </Box>
  );
}
