import type { SVGProps } from 'react';

export type OutlineIconProps = SVGProps<SVGSVGElement>;

export function OutlineIcon(props: OutlineIconProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      fill="none"
      height="1em"
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        height="14"
        rx="2"
        width="18"
        x="3"
        y="5"
      />
      <line
        x1="15"
        x2="15"
        y1="5"
        y2="19"
      />
    </svg>
  );
}
