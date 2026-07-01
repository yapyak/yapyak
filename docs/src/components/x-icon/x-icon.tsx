import type { SVGProps } from 'react';

export type XIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function XIcon(props: XIconProps) {
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
