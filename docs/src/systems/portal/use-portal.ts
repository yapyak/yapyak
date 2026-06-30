import type { ReactNode } from 'react';

import { createPortal } from 'react-dom';

import { toValue } from '#utils/to-value';

import { usePortalContext } from './use-portal-context';

export function usePortal(): (children: ReactNode) => ReactNode {
  const { element } = usePortalContext();

  return (children: ReactNode) => {
    const $element = toValue(element);

    return $element && createPortal(children, $element);
  };
}
