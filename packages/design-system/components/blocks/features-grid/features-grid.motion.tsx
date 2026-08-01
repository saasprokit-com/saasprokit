"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { containerVariants, itemVariants } from "../motion-presets";

export function FeaturesGridHeader({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="text-center"
      initial="hidden"
      variants={itemVariants}
      viewport={{ once: true, amount: 0.3 }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

interface FeaturesGridContainerProps {
  children: ReactNode;
  className?: string;
}

export function FeaturesGridContainer({
  className,
  children,
}: FeaturesGridContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={containerVariants}
      viewport={{ once: true, amount: 0.15 }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

export function FeaturesGridItem({ children }: { children: ReactNode }) {
  return <motion.div variants={itemVariants}>{children}</motion.div>;
}
