import type { SVGProps } from 'react';

export interface OutlineIconProps extends SVGProps<SVGSVGElement> {}

export function OutlineIcon(props: OutlineIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="5"
        cy="6"
        fill="currentColor"
        r="1.25"
        stroke="none"
      />
      <circle
        cx="5"
        cy="12"
        fill="currentColor"
        r="1.25"
        stroke="none"
      />
      <circle
        cx="5"
        cy="18"
        fill="currentColor"
        r="1.25"
        stroke="none"
      />
      <path d="M10 6h10" />
      <path d="M10 12h10" />
      <path d="M10 18h10" />
    </svg>
  );
}
