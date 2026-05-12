import { createFileRoute, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';

export const Route = createFileRoute('/guide')({
  component: Component,
});

function Component(): ReactElement {
  return (
    <div className="grid grid-cols-[240px_1fr] gap-12 px-6 py-12">
      <aside className="text-ink-300">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide">
          Guide
        </h3>
      </aside>
      <main className="prose prose-invert max-w-3xl">
        <Outlet />
      </main>
    </div>
  );
}
