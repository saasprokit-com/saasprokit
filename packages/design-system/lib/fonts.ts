import { cn } from '@repo/design-system/lib/utils';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { DM_Sans, Inter, Plus_Jakarta_Sans } from 'next/font/google';

// Every family a design preset can select must be declared here, because this
// is what defines the CSS variables the presets reference. Loading them via
// next/font rather than an @import from the Google CDN self-hosts them: no
// third-party request, no visitor IP sent to Google, and the CSP stays at
// 'self' for both style-src and font-src.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const fonts = cn(
  GeistSans.variable,
  GeistMono.variable,
  inter.variable,
  dmSans.variable,
  plusJakartaSans.variable,
  'touch-manipulation font-sans antialiased'
);
