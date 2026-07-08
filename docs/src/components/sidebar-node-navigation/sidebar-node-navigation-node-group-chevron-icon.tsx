import styles from './sidebar-node-navigation-node-group.module.css';

export function SidebarNodeNavigationNodeGroupChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.Chevron}
      height="12"
      viewBox="0 0 10 10"
      width="12"
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
