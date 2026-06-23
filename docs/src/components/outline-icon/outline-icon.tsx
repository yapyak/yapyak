import type { SVGProps } from 'react';

export type OutlineIconProps = SVGProps<SVGSVGElement>;

export function OutlineIcon(props: OutlineIconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M4 7h16" />
      <path d="M6 12h12" />
      <path d="M8 17h8" />
    </svg>
  );
}
