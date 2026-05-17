import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/guide/')({
  beforeLoad() {
    throw redirect({
      params: { _splat: 'introduction' },
      to: '/guide/$',
    });
  },
});
