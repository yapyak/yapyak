import { createFileRoute } from '@tanstack/react-router';
import { t } from 'yapyak';

import { FeatureSection } from '#components/feature-section';
import { Hero } from '#components/hero';

export const Route = createFileRoute('/')({
  component: Component,
});

function Component() {
  return (
    <>
      <Hero
        description={t('For Vite apps built at the speed of save.')}
        heading={t('i18n that keeps up.')}
      />
      <FeatureSection />
    </>
  );
}
