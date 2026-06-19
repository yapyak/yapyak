import type { ReactElement } from 'react';

export type XIconProps = {
  size?: number;
};

export function XIcon(props: XIconProps): ReactElement {
  const { size = 14 } = props;

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="6"
        x2="18"
        y1="6"
        y2="18"
      />
      <line
        x1="6"
        x2="18"
        y1="18"
        y2="6"
      />
    </svg>
  );
}
