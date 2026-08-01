import type { Variants } from "framer-motion";

// Expo-out. Fast start, long settle — reads as decisive rather than floaty.
export const EASE = [0.22, 1, 0.36, 1] as const;

export const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

// Scroll triggers use `viewport={{ once: true }}` at the call site: re-animating
// on scroll-back reads as a glitch.
