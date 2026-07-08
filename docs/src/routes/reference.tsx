import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { t } from 'yapyak';

import { ContentLayout } from '#components/content-layout';
import { OutlineDrawerTrigger } from '#components/outline-drawer-trigger';
import { PageAction } from '#components/page-action';
import { PageAnchorNavigation } from '#components/page-anchor-navigation';
import { SidebarDrawerTrigger } from '#components/sidebar-drawer-trigger';
import { SidebarNodeNavigation } from '#components/sidebar-node-navigation';

import { doc } from 'virtual:doc-compiler';

const splatRoute = getRouteApi('/reference/$');

export const Route = createFileRoute('/reference')({
  beforeLoad() {
    return {
      sidebarNodes: doc.getSidebarNodes('reference'),
    };
  },
  component: Component,
});

function Component() {
  const { sidebarNodes } = Route.useRouteContext();
  const { page } = splatRoute.useLoaderData();

  const sidebarContent = (
    <SidebarNodeNavigation
      aria-label={t('Reference navigation')}
      sidebarNodes={sidebarNodes}
    />
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{sidebarContent}</ContentLayout.Sidebar>
      <ContentLayout.Content>
        <ContentLayout.ContentHeader
          end={<OutlineDrawerTrigger page={page} />}
          start={<SidebarDrawerTrigger drawer={sidebarContent} />}
        />
        <ContentLayout.ContentContent>
          <Outlet />
        </ContentLayout.ContentContent>
      </ContentLayout.Content>
      <ContentLayout.Outline>
        <PageAnchorNavigation
          indicator={true}
          key={page.href}
          page={page}
        />
        <PageAction page={page} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
