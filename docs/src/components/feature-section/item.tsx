import type { BoxProps } from '#components/box';
import type { Feature } from '#components/feature-section';

import { Box } from '#components/box';

import styles from './item.module.css';

export interface FeatureSectionItemProps extends BoxProps<'li'> {
  feature: Feature;
}

export function FeatureSectionItem(props: FeatureSectionItemProps) {
  const { className, feature, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="li"
      className={[styles.FeatureSectionItem, className]}
      data-accent={feature.accent}
    >
      <Box
        aria-hidden="true"
        className={styles.IndicatorBar}
      />
      <Box
        as="span"
        className={styles.NumeralText}
      >
        {feature.number}
      </Box>
      <Box className={styles.ContentStack}>
        <Box
          as="h3"
          className={styles.TitleHeading}
        >
          {feature.title}
        </Box>
        <Box
          aria-hidden="true"
          as="span"
          className={styles.UnderlineDivider}
        />
        <Box
          as="p"
          className={styles.DescriptionParagraph}
        >
          {feature.description}
        </Box>
      </Box>
    </Box>
  );
}
