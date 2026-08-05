import { createFileRoute, redirect } from '@tanstack/react-router';
import { defaultLocale } from 'yapyak';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      params: {
        locale: defaultLocale,
      },
      replace: true,
      to: '/$locale',
    });
  },
});
