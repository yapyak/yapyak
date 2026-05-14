import { useLocation } from '@tanstack/react-router';
import { useState, type ReactElement } from 'react';
import type { RefModule } from '#docs/build-reference-sidebar';
import { ReferenceSidebarSymbol } from './reference-sidebar-symbol';
import styles from './reference-sidebar-module.module.css';

export interface ReferenceSidebarModuleProps {
  module: RefModule;
}

export function ReferenceSidebarModule(
  props: ReferenceSidebarModuleProps,
): ReactElement {
  const { module } = props;
  const location = useLocation();
  const isOnPath = location.pathname.startsWith(module.href);
  const hasChildren =
    module.symbols.length > 0 || module.submodules.length > 0;
  const isRootModule = module.id === 'yapyak';
  const [isOpen, setIsOpen] = useState(isOnPath);
  const showChildren = hasChildren && (isRootModule || isOpen);
  const displayName = lastSegment(module.id);

  return (
    <div className={styles.ReferenceSidebarModule}>
      {isRootModule ? (
        <h3 className={styles.RootHeading}>{displayName}</h3>
      ) : (
        <button
          type="button"
          className={styles.ToggleRow}
          aria-expanded={isOpen}
          data-open={isOpen ? 'true' : undefined}
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronIcon />
          <span className={styles.ModuleLabel}>{displayName}</span>
        </button>
      )}
      {showChildren ? (
        <ul
          className={styles.ChildList}
          data-flush={isRootModule ? 'true' : undefined}
        >
          {module.symbols.map((symbol) => (
            <li key={symbol.href}>
              <ReferenceSidebarSymbol symbol={symbol} />
            </li>
          ))}
          {module.submodules.map((submodule) => (
            <li key={submodule.id}>
              <ReferenceSidebarModule module={submodule} />
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
      className={styles.ChevronIcon}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
    >
      <path
        d="M3.5 2L7 5L3.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
