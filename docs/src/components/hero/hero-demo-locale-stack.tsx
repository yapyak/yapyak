import type { Locale } from '#lib/hero-demo';
import type { BoxProps } from '#primitives/box';

import { useEffect, useState } from 'react';

import { LOCALES } from '#lib/hero-demo';
import { Box } from '#primitives/box';

import { HeroDemoLocaleRow } from './hero-demo-locale-row';
import styles from './hero-demo-locale-stack.module.css';

export type HeroDemoLocaleStackProps = BoxProps & {
  receiving: boolean;
  savedSource: string;
  shimmering: Set<Locale>;
  translations: Record<Locale, string>;
};

export function HeroDemoLocaleStack(props: HeroDemoLocaleStackProps) {
  const {
    className,
    receiving,
    savedSource,
    shimmering,
    translations,
    ...restProps
  } = props;
  const [isPrimed, setIsPrimed] = useState(false);

  useEffect(() => {
    if (receiving) {
      setIsPrimed(true);
    }
  }, [
    receiving,
  ]);

  return (
    <Box
      {...restProps}
      className={[
        styles.HeroDemoLocaleStack,
        className,
      ]}
      data-primed={isPrimed}
      data-receiving={receiving}
    >
      <Box
        aria-hidden="true"
        as="span"
        className={styles.FlashOverlay}
      />
      {LOCALES.map((locale) => (
        <HeroDemoLocaleRow
          key={locale}
          locale={locale}
          savedSource={savedSource}
          shimmering={shimmering.has(locale)}
          value={translations[locale]}
        />
      ))}
    </Box>
  );
}
