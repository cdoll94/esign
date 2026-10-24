import type { SVGAttributes } from 'react';
import { useId } from 'react';

export type LogoProps = SVGAttributes<SVGSVGElement>;

// A filled tile with a signature stroke cut out of it, so it follows currentColor in light and dark mode.
export const BrandingLogoIcon = ({ ...props }: LogoProps) => {
  const maskId = useId();

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" {...props}>
      <mask id={maskId}>
        <rect width="84" height="84" fill="white" />
        <path
          d="M19 50c6-12 12-19 16-16s-5 15 1 14 9-13 13-10-1 9 5 8 7-6 11-7"
          fill="none"
          stroke="black"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M19 62h46" stroke="black" strokeWidth="4" strokeLinecap="round" />
      </mask>
      <rect x="4" y="4" width="76" height="76" rx="20" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
};
