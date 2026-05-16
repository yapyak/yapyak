import type { ReactElement } from 'react';
import type { LocaleCode } from './scenes';

import { LocaleFlag } from '#components/locale-flag';

import styles from './hero-demo-locales.module.css';
import { LOCALES } from './scenes';

export interface HeroDemoLocalesProps {
  receiving: boolean;
  savedSource: string;
  shimmering: Set<LocaleCode>;
  translations: Record<LocaleCode, string>;
}

export function HeroDemoLocales(props: HeroDemoLocalesProps): ReactElement {
  const { savedSource, translations, shimmering, receiving } = props;
  return (
    <div
      className={styles.HeroDemoLocales}
      data-receiving={receiving || undefined}
    >
      <span
        aria-hidden="true"
        className={styles.Flash}
      />
      {LOCALES.map((locale) => {
        const value = translations[locale.code];
        const isShimmering = shimmering.has(locale.code);
        return (
          <div
            className={styles.LocaleRow}
            key={locale.code}
          >
            <span
              aria-hidden="true"
              className={styles.Flag}
            >
              <LocaleFlag code={locale.code} />
            </span>
            <span className={styles.Filename}>{locale.filename}</span>
            <span className={styles.Json}>
              <span className="tx-punct">{'{ '}</span>
              <span
                className={styles.Key}
                key={savedSource}
              >
                <span className="tx-string">
                  <span>"</span>
                  {savedSource}
                  <span>"</span>
                </span>
              </span>
              <span className="tx-punct">: </span>
              {isShimmering || value === '' ? (
                <span
                  aria-hidden="true"
                  className={styles.Skeleton}
                />
              ) : (
                <span
                  className={styles.Value}
                  key={value}
                >
                  <span className="tx-tx-source">
                    <span>"</span>
                    {value}
                    <span>"</span>
                  </span>
                </span>
              )}
              <span className="tx-punct">{' }'}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
