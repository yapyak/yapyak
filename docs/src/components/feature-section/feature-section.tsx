import type { BoxProps } from '#primitives/box';

import { getFeatures } from '#lib/feature';
import { Box } from '#primitives/box';

import styles from './feature-section.module.css';
import { FeatureSectionItem } from './feature-section-item';

export type FeatureSectionProps = BoxProps<'section'>;

export function FeatureSection(props: FeatureSectionProps) {
  const { className, ...restProps } = props;

  const features = getFeatures();

  return (
    <Box
      {...restProps}
      as="section"
      className={[
        styles.FeatureSection,
        className,
      ]}
    >
      <Box
        aria-hidden="true"
        className={styles.Divider}
      />
      <Box
        as="ol"
        className={styles.List}
      >
        {features.map((feature) => (
          <FeatureSectionItem
            feature={feature}
            key={feature.number}
          />
        ))}
      </Box>
    </Box>
  );
}
