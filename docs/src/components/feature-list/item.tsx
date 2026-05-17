import type { BoxProps } from '#components/box';
import type { Feature } from '#utils/features';

import { Box } from '#components/box';

import styles from './item.module.css';

export interface FeatureListItemProps extends BoxProps<'li'> {
  feature: Feature;
}

export function FeatureListItem(props: FeatureListItemProps) {
  const { className, feature, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="li"
      className={[styles.FeatureListItem, className]}
      data-accent={feature.accent}
    >
      <Box
        aria-hidden="true"
        className={styles.Indicator}
      />
      <Box
        as="span"
        className={styles.Numeral}
      >
        {feature.number}
      </Box>
      <Box className={styles.Content}>
        <Box
          as="h3"
          className={styles.Title}
        >
          {feature.title}
        </Box>
        <Box
          aria-hidden="true"
          as="span"
          className={styles.Underline}
        />
        <Box
          as="p"
          className={styles.Description}
        >
          {feature.description}
        </Box>
      </Box>
    </Box>
  );
}
