import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { FEATURES } from '#utils/features';

import { FeatureListItem } from './feature-list/item';
import styles from './feature-list.module.css';

export interface FeatureListProps extends BoxProps<'section'> {}

export function FeatureList(props: FeatureListProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.FeatureList, className]}
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
          <FeatureListItem
            feature={feature}
            key={feature.number}
          />
        ))}
      </Box>
    </Box>
  );
}
