import type { SVGProps } from 'react';

export type CopyIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function CopyIcon(props: CopyIconProps) {
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
      <rect
        height="13"
        rx="2"
        width="13"
        x="9"
        y="9"
      />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
