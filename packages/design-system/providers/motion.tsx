"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` disables transform animations for visitors who set
 * "Reduce motion" at the OS level, while keeping opacity fades — fades are not
 * a vestibular trigger, so suppressing them would cost clarity for no benefit.
 *
 * Without this every framer-motion animation ignores the setting: the only
 * prefers-reduced-motion rule in the codebase is the smooth-scroll guard in
 * globals.css, which covers CSS scrolling and nothing else.
 */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);
