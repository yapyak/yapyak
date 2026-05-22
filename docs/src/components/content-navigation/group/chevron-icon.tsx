import styles from '../group.module.css';

export function ChevronIcon() {
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
