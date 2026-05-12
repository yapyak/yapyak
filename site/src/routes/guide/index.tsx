import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/guide/')({
  beforeLoad() {
    throw redirect({
      to: '/guide/$',
      params: { _splat: 'introduction' },
    });
  },
});
