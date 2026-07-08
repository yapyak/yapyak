import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { t } from 'yapyak';

import { ContentLayout } from '#components/content-layout';
import { OutlineDrawerTrigger } from '#components/outline-drawer-trigger';
import { PageAction } from '#components/page-action';
import { PageAnchorNavigation } from '#components/page-anchor-navigation';
import { SidebarDrawerTrigger } from '#components/sidebar-drawer-trigger';
import { SidebarNodeNavigation } from '#components/sidebar-node-navigation';

import { doc } from 'virtual:doc-compiler';

const splatRoute = getRouteApi('/guide/$');

export const Route = createFileRoute('/guide')({
  beforeLoad() {
    return {
      sidebarNodes: doc.getSidebarNodes('guide'),
    };
  },
  component: Component,
});

function Component() {
  const { sidebarNodes } = Route.useRouteContext();
  const { blocks, page } = splatRoute.useLoaderData();

  const sidebarContent = (
    <SidebarNodeNavigation
      aria-label={t('Guide navigation')}
      sidebarNodes={sidebarNodes}
    />
  );

  return (
    <ContentLayout>
      <ContentLayout.Sidebar>{sidebarContent}</ContentLayout.Sidebar>
      <ContentLayout.Content>
        <ContentLayout.ContentHeader
          end={
            <OutlineDrawerTrigger
              blocks={blocks}
              page={page}
            />
          }
          start={<SidebarDrawerTrigger drawer={sidebarContent} />}
        />
        <ContentLayout.ContentContent>
          <Outlet />
        </ContentLayout.ContentContent>
      </ContentLayout.Content>
      <ContentLayout.Outline>
        <PageAnchorNavigation
          blocks={blocks}
          indicator={true}
          key={page.href}
        />
        <PageAction page={page} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
