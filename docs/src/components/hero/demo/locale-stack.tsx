import type { BoxProps } from '#components/box';
import type { LocaleCode } from '#utils/hero-demo-scenes';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { LOCALES } from '#utils/hero-demo-scenes';

import { HeroDemoLocaleFlag } from './locale-flag';
import styles from './locale-stack.module.css';

export interface HeroDemoLocaleStackProps extends BoxProps {
  receiving: boolean;
  savedSource: string;
  shimmering: Set<LocaleCode>;
  translations: Record<LocaleCode, string>;
}

export function HeroDemoLocaleStack(props: HeroDemoLocaleStackProps) {
  const { className, receiving, savedSource, shimmering, translations } = props;

  return (
    <Box
      className={[styles.HeroDemoLocaleStack, className]}
      data-receiving={receiving}
    >
      <Box
        aria-hidden="true"
        as="span"
        className={styles.Flash}
      />
      {LOCALES.map((locale) => {
        const value = translations[locale.code];
        const isShimmering = shimmering.has(locale.code);
        return (
          <Box
            className={styles.LocaleRow}
            key={locale.code}
          >
            <Box
              aria-hidden="true"
              as="span"
              className={styles.Flag}
            >
              <HeroDemoLocaleFlag code={locale.code} />
            </Box>
            <Box
              as="span"
              className={styles.Filename}
            >
              {locale.filename}
            </Box>
            <Box
              as="span"
              className={styles.Json}
            >
              <CodeBlockToken type="punct">{'{ '}</CodeBlockToken>
              <Box
                as="span"
                className={styles.Key}
                key={savedSource}
              >
                <CodeBlockToken type="string">
                  <Box as="span">"</Box>
                  {savedSource}
                  <Box as="span">"</Box>
                </CodeBlockToken>
              </Box>
              <CodeBlockToken type="punct">: </CodeBlockToken>
              {isShimmering || value === '' ? (
                <Box
                  aria-hidden="true"
                  as="span"
                  className={styles.Skeleton}
                />
              ) : (
                <Box
                  as="span"
                  className={styles.Value}
                  key={value}
                >
                  <CodeBlockToken type="tx-source">
                    <Box as="span">"</Box>
                    {value}
                    <Box as="span">"</Box>
                  </CodeBlockToken>
                </Box>
              )}
              <CodeBlockToken type="punct">{' }'}</CodeBlockToken>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
