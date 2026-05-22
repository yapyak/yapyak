import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { doc } from 'virtual:doc-extractor';

export const Route = createFileRoute('/reference/')({
  beforeLoad() {
    const firstPage = doc.getFirstPage('reference');
    if (firstPage === null) {
      throw notFound();
    }
    throw redirect({ replace: true, to: firstPage.href });
  },
});
