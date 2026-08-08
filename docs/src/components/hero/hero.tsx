import type { BoxProps } from '#primitives/box';

import { t } from 'yapyak';

import { Box } from '#primitives/box';
import { LinkBase } from '#primitives/link';

import styles from './hero.module.css';
import { HeroDemo } from './hero-demo';

export type HeroProps = BoxProps<'section'> & {
  description: string;
  heading: string;
  initialFramework?: string;
};

export function Hero(props: HeroProps) {
  const { className, description, heading, initialFramework, ...restProps } =
    props;

  return (
    <Box
      {...restProps}
      as="section"
      className={[
        styles.Hero,
        className,
      ]}
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
          <LinkBase
            className={styles.PrimaryLink}
            to="/guide"
          >
            {t('Get Started')}
          </LinkBase>
          <Box
            as="a"
            className={styles.SecondaryLink}
            href="https://github.com/yapyak/yapyak"
          >
            {t('View on GitHub')}
          </Box>
        </Box>
        <Box
          as="p"
          className={styles.TrustParagraph}
        >
          {t('Open source. Use any LLM. No vendor lock-in.')}
        </Box>
      </Box>
      <HeroDemo initialFramework={initialFramework} />
    </Box>
  );
}
