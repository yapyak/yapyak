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
        description={t('Built for Vite. Designed for the AI era.')}
        heading={t('i18n that maintains itself.')}
      />
      <FeatureList />
    </div>
  );
}
