import type { BoxProps } from '#components/box';
import type { RefModule } from '#docs/build-reference-sidebar';

import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';

import { Box } from '#components/box';

import styles from './module.module.css';
import { ReferenceNavigationSymbol } from './symbol';

export interface ReferenceNavigationModuleProps extends BoxProps {
  module: RefModule;
}

export function ReferenceNavigationModule(
  props: ReferenceNavigationModuleProps,
) {
  const { className, module, ...restProps } = props;
  const location = useLocation();
  const isOnPath = location.pathname.startsWith(module.href);
  const hasChildren = module.symbols.length > 0 || module.submodules.length > 0;
  const [isOpen, setIsOpen] = useState(isOnPath);
  const displayName = lastSegment(module.id);

  return (
    <Box
      {...restProps}
      className={[styles.ReferenceNavigationModule, className]}
    >
      <Box
        aria-expanded={isOpen}
        as="button"
        className={styles.ToggleButton}
        data-open={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ChevronIcon />
        <Box
          as="span"
          className={styles.ModuleLabel}
        >
          {displayName}
        </Box>
      </Box>
      {hasChildren && isOpen && (
        <Box
          as="ul"
          className={styles.ChildList}
        >
          {module.symbols.map((symbol) => (
            <Box
              as="li"
              key={symbol.href}
            >
              <ReferenceNavigationSymbol symbol={symbol} />
            </Box>
          ))}
          {module.submodules.map((submodule) => (
            <Box
              as="li"
              key={submodule.id}
            >
              <ReferenceNavigationModule module={submodule} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function lastSegment(id: string) {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.ChevronIcon}
      height="10"
      viewBox="0 0 10 10"
      width="10"
    >
      <path
        d="M3.5 2L7 5L3.5 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}
