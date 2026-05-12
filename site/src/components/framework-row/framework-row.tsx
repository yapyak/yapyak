import type { ReactElement } from 'react';
import { t } from 'yapyak';
import styles from './framework-row.module.css';

export function FrameworkRow(): ReactElement {
  return (
    <section className={styles.FrameworkRow}>
      <h2 className={styles.Heading}>{t('Works seamlessly with')}</h2>
      <div className={styles.Logos}>
        <img src="/logos/react.svg" alt="React" className={styles.Logo} />
        <img src="/logos/svelte.svg" alt="Svelte" className={styles.Logo} />
        <img src="/logos/vue.svg" alt="Vue" className={styles.Logo} />
      </div>
      <p className={styles.Footnote}>
        {t('SSR adapters for TanStack Start and SvelteKit included')}
      </p>
    </section>
  );
}
