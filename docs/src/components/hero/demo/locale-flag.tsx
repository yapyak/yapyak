import { useId } from 'react';

import styles from './locale-flag.module.css';

export type DemoLocaleFlagCode = 'sv' | 'es' | 'ja' | 'de';

export interface DemoLocaleFlagProps {
  code: DemoLocaleFlagCode;
}

export function DemoLocaleFlag(props: DemoLocaleFlagProps) {
  const { code } = props;
  const id = useId();
  const clipId = `${id}-clip`;
  return (
    <svg
      aria-hidden="true"
      className={styles.DemoLocaleFlag}
      height={12}
      viewBox="0 0 18 12"
      width={18}
    >
      <clipPath id={clipId}>
        <rect
          height="12"
          rx="2"
          width="18"
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{renderFlag(code)}</g>
      <rect
        fill="none"
        height="11"
        rx="1.5"
        stroke="var(--ring-strong)"
        strokeWidth="1"
        width="17"
        x="0.5"
        y="0.5"
      />
    </svg>
  );
}

function renderFlag(code: DemoLocaleFlagCode) {
  switch (code) {
    case 'sv':
      return (
        <>
          <rect
            fill="#0061A8"
            height="12"
            width="18"
          />
          <rect
            fill="#FECC00"
            height="2"
            width="18"
            y="5"
          />
          <rect
            fill="#FECC00"
            height="12"
            width="2"
            x="5"
          />
        </>
      );
    case 'es':
      return (
        <>
          <rect
            fill="#C60B1E"
            height="3"
            width="18"
          />
          <rect
            fill="#FFC400"
            height="6"
            width="18"
            y="3"
          />
          <rect
            fill="#C60B1E"
            height="3"
            width="18"
            y="9"
          />
        </>
      );
    case 'ja':
      return (
        <>
          <rect
            fill="#FFFFFF"
            height="12"
            width="18"
          />
          <circle
            cx="9"
            cy="6"
            fill="#BC002D"
            r="3"
          />
        </>
      );
    case 'de':
      return (
        <>
          <rect
            fill="#0A0A0A"
            height="4"
            width="18"
          />
          <rect
            fill="#DD0000"
            height="4"
            width="18"
            y="4"
          />
          <rect
            fill="#FFCC00"
            height="4"
            width="18"
            y="8"
          />
        </>
      );
  }
}
