import { createFileRoute } from '@tanstack/react-router';

import { redirectToFirstPage } from '#utils/load-page';

export const Route = createFileRoute('/reference/')({
  loader() {
    redirectToFirstPage('reference');
  },
});
