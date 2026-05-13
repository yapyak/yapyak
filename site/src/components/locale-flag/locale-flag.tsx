import { type ReactElement, type ReactNode, useId } from 'react';
import styles from './locale-flag.module.css';

export type LocaleFlagCode = 'sv' | 'es' | 'ja' | 'de';

export interface LocaleFlagProps {
  code: LocaleFlagCode;
}

export function LocaleFlag(props: LocaleFlagProps): ReactElement {
  const { code } = props;
  const id = useId();
  const clipId = `${id}-clip`;
  return (
    <svg
      viewBox="0 0 18 12"
      width={18}
      height={12}
      className={styles.LocaleFlag}
      aria-hidden="true"
    >
      <clipPath id={clipId}>
        <rect width="18" height="12" rx="2" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{renderFlag(code)}</g>
      <rect
        x="0.5"
        y="0.5"
        width="17"
        height="11"
        rx="1.5"
        fill="none"
        stroke="rgba(255, 255, 255, 0.12)"
        strokeWidth="1"
      />
    </svg>
  );
}

function renderFlag(code: LocaleFlagCode): ReactNode {
  switch (code) {
    case 'sv':
      return (
        <>
          <rect width="18" height="12" fill="#0061A8" />
          <rect y="5" width="18" height="2" fill="#FECC00" />
          <rect x="5" width="2" height="12" fill="#FECC00" />
        </>
      );
    case 'es':
      return (
        <>
          <rect width="18" height="3" fill="#C60B1E" />
          <rect y="3" width="18" height="6" fill="#FFC400" />
          <rect y="9" width="18" height="3" fill="#C60B1E" />
        </>
      );
    case 'ja':
      return (
        <>
          <rect width="18" height="12" fill="#FFFFFF" />
          <circle cx="9" cy="6" r="3" fill="#BC002D" />
        </>
      );
    case 'de':
      return (
        <>
          <rect width="18" height="4" fill="#0A0A0A" />
          <rect y="4" width="18" height="4" fill="#DD0000" />
          <rect y="8" width="18" height="4" fill="#FFCC00" />
        </>
      );
  }
}
