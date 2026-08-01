import { cn } from '@repo/design-system/lib/utils';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

// Defines --font-geist-sans / --font-geist-mono, which globals.css maps
// --font-sans / --font-mono onto. Must be applied to every <body> in the app,
// including global-error.tsx, which renders its own document.
export const fonts = cn(
  GeistSans.variable,
  GeistMono.variable,
  'touch-manipulation font-sans antialiased'
);
