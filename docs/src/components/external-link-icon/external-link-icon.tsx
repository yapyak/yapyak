import type { SVGProps } from 'react';

export type ExternalLinkIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function ExternalLinkIcon(props: ExternalLinkIconProps) {
  const { size = 14, ...restProps } = props;

  return (
    <svg
      {...restProps}
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line
        x1="10"
        x2="21"
        y1="14"
        y2="3"
      />
    </svg>
  );
}
