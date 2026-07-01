import type { SVGProps } from 'react';

export type CheckIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function CheckIcon(props: CheckIconProps) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
