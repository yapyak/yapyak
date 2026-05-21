import type { BoxProps } from '#components/box';
import type { LocaleCode } from '#utils/hero-demo-scenes';

import { Box } from '#components/box';
import { CodeBlockToken } from '#components/code-block-token';
import { LOCALES } from '#utils/hero-demo-scenes';

import { DemoLocaleFlag } from './locale-flag';
import styles from './locale-stack.module.css';

export interface DemoLocaleStackProps extends BoxProps {
  receiving: boolean;
  savedSource: string;
  shimmering: Set<LocaleCode>;
  translations: Record<LocaleCode, string>;
}

export function DemoLocaleStack(props: DemoLocaleStackProps) {
  const {
    className,
    receiving,
    savedSource,
    shimmering,
    translations,
    ...restProps
  } = props;

  return (
    <Box
      {...restProps}
      className={[styles.DemoLocaleStack, className]}
      data-receiving={receiving}
    >
      <Box
        aria-hidden="true"
        as="span"
        className={styles.FlashOverlay}
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
              className={styles.FlagIcon}
            >
              <DemoLocaleFlag code={locale.code} />
            </Box>
            <Box
              as="span"
              className={styles.FilenameText}
            >
              {locale.filename}
            </Box>
            <Box
              as="span"
              className={styles.JsonText}
            >
              <CodeBlockToken type="punct">{'{ '}</CodeBlockToken>
              <Box
                as="span"
                className={styles.KeyText}
                key={savedSource}
              >
                <CodeBlockToken type="string">
                  <Box as="span">"</Box>
                  {savedSource}
                  <Box as="span">"</Box>
                </CodeBlockToken>
              </Box>
              <CodeBlockToken type="punct">: </CodeBlockToken>
              {isShimmering || !value ? (
                <Box
                  aria-hidden="true"
                  as="span"
                  className={styles.Skeleton}
                />
              ) : (
                <Box
                  as="span"
                  className={styles.ValueText}
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
