import type { ReactNode } from 'react';
import type { BoxProps } from '#components/box';
import type { Feature } from '#components/feature-section';

import { Box } from '#components/box';

import styles from './feature-section-item.module.css';

const CODE_PATTERN = /`([^`]+)`|t(?:\.(?:at|in))?\([^)]*\)/g;

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
          {renderDescription(feature.description)}
        </Box>
      </Box>
    </Box>
  );
}

function renderDescription(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let keyIndex = 0;
  CODE_PATTERN.lastIndex = 0;
  let match = CODE_PATTERN.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const content = match[1] ?? match[0];
    parts.push(
      <Box
        as="code"
        className={styles.InlineCode}
        key={keyIndex}
      >
        {content}
      </Box>,
    );
    keyIndex++;
    lastIndex = match.index + match[0].length;
    match = CODE_PATTERN.exec(text);
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
