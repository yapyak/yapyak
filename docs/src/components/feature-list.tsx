import type { BoxProps } from '#components/box';

import { Box } from '#components/box';
import { FEATURES } from '#utils/features';

import { FeatureListItem } from './feature-list/item';
import styles from './feature-list.module.css';

export interface FeatureListProps extends BoxProps<'ol'> {}

export function FeatureList(props: FeatureListProps) {
  const { className, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="ol"
      className={[styles.FeatureList, className]}
    >
      {FEATURES.map((feature) => (
        <FeatureListItem
          feature={feature}
          key={feature.number}
        />
      ))}
    </Box>
  );
}
