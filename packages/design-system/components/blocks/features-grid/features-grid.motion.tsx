"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

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
  className?: string;
  children: ReactNode;
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
