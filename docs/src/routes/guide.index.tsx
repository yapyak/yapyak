import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/guide/')({
  beforeLoad() {
    const firstPage = doc.getFirstPage('guide');
    if (firstPage === null) {
      throw notFound();
    }
    throw redirect({ replace: true, to: firstPage.href });
  },
});
