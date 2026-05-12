import { createFileRoute } from '@tanstack/react-router';
import { t } from 'yapyak';
import { Hero } from '#components/hero';

export const Route = createFileRoute('/')({
  component: Component,
});

function Component() {
  return (
    <main>
      <Hero
        heading={t('The i18n Library for Vite apps')}
        description={t(
          'yapyak is a self-maintaining i18n library that translates your strings as you save.',
        )}
      />
    </main>
  );
}
