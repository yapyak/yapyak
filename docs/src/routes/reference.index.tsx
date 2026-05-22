import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/reference/')({
  beforeLoad() {
    throw redirect({
      params: { _splat: 'introduction' },
      to: '/reference/$',
    });
  },
});
