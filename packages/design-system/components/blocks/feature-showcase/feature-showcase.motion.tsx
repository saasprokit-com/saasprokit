"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { EASE } from "../motion-presets";

interface FeatureShowcaseMotionItemProps {
  badge: ReactNode;
  bullets: string[];
  description: string;
  isReversed: boolean;
  title: string;
  visual: ReactNode;
}

export function FeatureShowcaseMotionItem({
  isReversed,
  visual,
  badge,
  title,
  description,
  bullets,
}: FeatureShowcaseMotionItemProps) {
  return (
    <div
      className={`flex flex-col items-center gap-12 lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""}`}
    >
      <motion.div
        className="flex w-full items-center justify-center lg:w-1/2"
        initial={{ opacity: 0, x: isReversed ? 60 : -60 }}
        transition={{ duration: 0.6, ease: EASE }}
        viewport={{ once: true, amount: 0.3 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        {visual}
      </motion.div>

      <motion.div
        className="w-full lg:w-1/2"
        initial={{ opacity: 0, x: isReversed ? -60 : 60 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
        viewport={{ once: true, amount: 0.3 }}
        whileInView={{ opacity: 1, x: 0 }}
      >
        <div className="mb-4">{badge}</div>
        <h2 className="font-bold text-2xl tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 text-muted-foreground">{description}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map((bullet, bulletIndex) => (
            <motion.li
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              key={bullet}
              transition={{
                duration: 0.4,
                ease: EASE,
                delay: 0.3 + bulletIndex * 0.08,
              }}
              viewport={{ once: true, amount: 0.6 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
              <span className="text-muted-foreground text-sm">{bullet}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
