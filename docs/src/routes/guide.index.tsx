import { createFileRoute } from '@tanstack/react-router';

import { redirectToFirstPage } from '#lib/page';

export const Route = createFileRoute('/guide/')({
  loader() {
    redirectToFirstPage('guide');
  },
});
