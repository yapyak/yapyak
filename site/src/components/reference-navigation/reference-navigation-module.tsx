import type { ReactElement } from 'react';
import type { RefModule } from '#docs/build-reference-sidebar';

import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';

import styles from './reference-navigation-module.module.css';
import { ReferenceNavigationSymbol } from './reference-navigation-symbol';

export interface ReferenceNavigationModuleProps {
  module: RefModule;
}

export function ReferenceNavigationModule(
  props: ReferenceNavigationModuleProps,
): ReactElement {
  const { module } = props;
  const location = useLocation();
  const isOnPath = location.pathname.startsWith(module.href);
  const hasChildren = module.symbols.length > 0 || module.submodules.length > 0;
  const [isOpen, setIsOpen] = useState(isOnPath);
  const displayName = lastSegment(module.id);

  return (
    <div className={styles.ReferenceNavigationModule}>
      <button
        aria-expanded={isOpen}
        className={styles.ToggleRow}
        data-open={isOpen ? 'true' : undefined}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ChevronIcon />
        <span className={styles.ModuleLabel}>{displayName}</span>
      </button>
      {hasChildren && isOpen ? (
        <ul className={styles.ChildList}>
          {module.symbols.map((symbol) => (
            <li key={symbol.href}>
              <ReferenceNavigationSymbol symbol={symbol} />
            </li>
          ))}
          {module.submodules.map((submodule) => (
            <li key={submodule.id}>
              <ReferenceNavigationModule module={submodule} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function lastSegment(id: string): string {
  const slashIndex = id.lastIndexOf('/');
  return slashIndex === -1 ? id : id.slice(slashIndex + 1);
}

function ChevronIcon(): ReactElement {
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
