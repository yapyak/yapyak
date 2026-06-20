import { useId } from 'react';

import styles from './hero-demo-locale-flag.module.css';

export type HeroDemoLocaleFlagCode = 'es' | 'fr' | 'ja' | 'sv';

export type HeroDemoLocaleFlagProps = {
  code: HeroDemoLocaleFlagCode;
};

export function HeroDemoLocaleFlag(props: HeroDemoLocaleFlagProps) {
  const { code } = props;
  const id = useId();
  const clipId = `${id}-clip`;
  return (
    <svg
      aria-hidden="true"
      className={styles.HeroDemoLocaleFlag}
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
        stroke="var(--ring-stronger)"
        strokeWidth="1"
        width="17"
        x="0.5"
        y="0.5"
      />
    </svg>
  );
}

function renderFlag(code: HeroDemoLocaleFlagCode) {
  switch (code) {
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
    case 'fr':
      return (
        <>
          <rect
            fill="#0055A4"
            height="12"
            width="6"
          />
          <rect
            fill="#FFFFFF"
            height="12"
            width="6"
            x="6"
          />
          <rect
            fill="#EF4135"
            height="12"
            width="6"
            x="12"
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
    default:
      return null;
  }
}
