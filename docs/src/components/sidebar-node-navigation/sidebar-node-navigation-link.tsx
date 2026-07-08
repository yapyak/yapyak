import type { SidebarLinkNode } from '@yapyak/doc-compiler';
import type { LinkBaseProps } from '#primitives/link';

import { useLocation } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { LinkBase } from '#primitives/link';

import styles from './sidebar-node-navigation-link.module.css';

export type SidebarNodeNavigationLinkProps = LinkBaseProps & {
  sidebarNode: SidebarLinkNode;
};

export function SidebarNodeNavigationLink(
  props: SidebarNodeNavigationLinkProps,
) {
  const { className, sidebarNode, ...restProps } = props;
  const isDeprecated = sidebarNode.badge?.variant === 'deprecated';
  const element = useRef<HTMLAnchorElement>(null);
  const initialPathname = useLocation({
    select: (location) => location.pathname,
  });
  const isActiveOnMountRef = useRef(initialPathname === sidebarNode.href);

  useEffect(() => {
    const $element = element.current;
    if (!isActiveOnMountRef.current || $element === null) {
      return;
    }

    let isCancelled = false;
    let frame = 0;

    const scrollToActive = () => {
      frame = window.requestAnimationFrame(() => {
        if (!isCancelled) {
          $element.scrollIntoView({
            block: 'center',
          });
        }
      });
    };

    document.fonts.ready.then(scrollToActive);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <LinkBase
      {...restProps}
      activeOptions={{
        exact: true,
      }}
      className={[
        styles.SidebarNodeNavigationLink,
        className,
      ]}
      data-deprecated={isDeprecated}
      ref={element}
      to={sidebarNode.href}
    >
      {sidebarNode.label}
    </LinkBase>
  );
}
