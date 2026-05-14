import type { ReactElement, ReactNode } from 'react';
import { t } from 'yapyak';
import styles from './framework-row.module.css';

const FRAMEWORK_LINKS: Record<string, string> = {
  'TanStack Start': 'https://tanstack.com/start',
  SvelteKit: 'https://svelte.dev/docs/kit',
};

const LINK_PATTERN = /(TanStack Start|SvelteKit)/g;

function linkifyFrameworks(text: string): ReactNode[] {
  const parts = text.split(LINK_PATTERN);
  return parts.map((part, index) => {
    const href = FRAMEWORK_LINKS[part];
    if (href !== undefined) {
      return (
        <a
          // biome-ignore lint/suspicious/noArrayIndexKey: stable split order
          key={index}
          href={href}
          className={styles.Link}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function FrameworkRow(): ReactElement {
  return (
    <section className={styles.FrameworkRow}>
      <h2 className={styles.Heading}>{t('Works seamlessly with')}</h2>
      <div className={styles.Logos}>
        <img src="/logos/react.svg" alt="React" className={styles.Logo} />
        <img src="/logos/vue.svg" alt="Vue" className={styles.Logo} />
        <img src="/logos/svelte.svg" alt="Svelte" className={styles.Logo} />
      </div>
      <p className={styles.Footnote}>
        {linkifyFrameworks(
          t('SSR adapters for TanStack Start and SvelteKit included'),
        )}
      </p>
    </section>
  );
}
