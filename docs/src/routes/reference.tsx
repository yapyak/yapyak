import { Outlet, createFileRoute, getRouteApi } from '@tanstack/react-router';
import { getAnchors } from '@yapyak/doc-compiler';
import { t } from 'yapyak';

import { AnchorNavigation } from '#components/anchor-navigation';
import { ContentLayout } from '#components/content-layout';
import { OutlineDrawerTrigger } from '#components/outline-drawer-trigger';
import { PageAction } from '#components/page-action';
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
  const { blocks, page } = splatRoute.useLoaderData();
  const anchors = getAnchors(blocks, {
    maxLevel: 3,
    minLevel: 2,
  });

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
          end={
            <OutlineDrawerTrigger
              anchors={anchors}
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
        {anchors.length > 0 && (
          <AnchorNavigation
            anchors={anchors}
            indicator={true}
            key={page.href}
          />
        )}
        <PageAction page={page} />
      </ContentLayout.Outline>
    </ContentLayout>
  );
}
