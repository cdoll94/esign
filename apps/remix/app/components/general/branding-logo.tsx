import { PLATFORM_NAME } from '@documenso/lib/constants/app';
import type { SVGAttributes } from 'react';

import { BrandingLogoIcon } from './branding-logo-icon';

export type LogoProps = SVGAttributes<SVGSVGElement>;

// Approximate advance width of a character at the wordmark's font size, used to size the viewBox.
const CHARACTER_WIDTH = 112;

export const BrandingLogo = ({ ...props }: LogoProps) => {
  const name = PLATFORM_NAME();
  const width = 380 + name.length * CHARACTER_WIDTH;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} 320`} role="img" aria-label={name} {...props}>
      <BrandingLogoIcon x="0" y="0" width="320" height="320" />
      <text
        x="380"
        y="226"
        fill="currentColor"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="200"
        fontWeight="600"
        letterSpacing="-4"
      >
        {name}
      </text>
    </svg>
  );
};
