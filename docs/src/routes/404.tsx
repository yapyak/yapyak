import { createFileRoute } from '@tanstack/react-router';

import { NotFoundView } from '#components/not-found-view';

export const Route = createFileRoute('/404')({
  component: Component,
});

function Component() {
  return <NotFoundView />;
}
