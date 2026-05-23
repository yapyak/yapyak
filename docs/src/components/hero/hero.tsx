import type { BoxProps } from '#components/box';

import { Link } from '@tanstack/react-router';
import { $t } from 'yapyak';

import { Box } from '#components/box';

import { HeroDemo } from './hero-demo';
import styles from './hero.module.css';

export interface HeroProps extends BoxProps<'section'> {
  description: string;
  heading: string;
}

export function Hero(props: HeroProps) {
  const { className, description, heading, ...restProps } = props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[styles.Hero, className]}
    >
      <Box className={styles.Stack}>
        <Box
          as="h1"
          className={styles.Heading}
        >
          {heading}
        </Box>
        <Box
          as="p"
          className={styles.DescriptionParagraph}
        >
          {description}
        </Box>
        <Box className={styles.ActionRow}>
          <Box
            as={Link}
            className={styles.PrimaryLink}
            to="/guide"
          >
            {$t('Get Started')}
          </Box>
          <Box
            as="a"
            className={styles.SecondaryLink}
            href="https://github.com/yapyak/yapyak"
          >
            {$t('View on GitHub')}
          </Box>
        </Box>
        <Box
          as="p"
          className={styles.TrustParagraph}
        >
          {$t('Open source. Use any LLM. No vendor lock-in.')}
        </Box>
      </Box>
      <HeroDemo />
    </Box>
  );
}
