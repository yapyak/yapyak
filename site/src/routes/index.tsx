import { createFileRoute } from '@tanstack/react-router';
import { t } from 'yapyak';
import { FeatureList } from '#components/feature-list';
import { Hero } from '#components/hero';

export const Route = createFileRoute('/')({
  component: Component,
});

function Component() {
  return (
    <div>
      <Hero
        heading={t('i18n that maintains itself.')}
        description={t('Built for Vite. Designed for the AI era.')}
      />
      <FeatureList />
    </div>
  );
}
