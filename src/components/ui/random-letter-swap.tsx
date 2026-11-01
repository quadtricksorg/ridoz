"use client";

import { useState } from "react";
import { motion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

interface RandomLetterSwapProps {
  label: string;
  className?: string;
  /** Delay between letters, in seconds. */
  staggerDuration?: number;
  transition?: Transition;
}

function shuffled(length: number) {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** Text whose letters roll up and are replaced in a random order on hover or focus. */
export function RandomLetterSwap({
  label,
  className,
  staggerDuration = 0.03,
  transition = { duration: 0.5, type: "spring" },
}: RandomLetterSwapProps) {
  const [hovered, setHovered] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const letters = Array.from(label);

  const start = () => {
    setOrder(shuffled(letters.length));
    setHovered(true);
  };

  return (
    <span
      className={cn("relative inline-flex whitespace-pre", className)}
      onMouseEnter={start}
      onMouseLeave={() => setHovered(false)}
      onFocus={start}
      onBlur={() => setHovered(false)}
    >
      <span className="sr-only">{label}</span>
      {letters.map((letter, i) => {
        const t = { ...transition, delay: (order[i] ?? i) * staggerDuration };
        return (
          <span key={i} aria-hidden className="relative inline-block overflow-hidden">
            <motion.span className="inline-block" animate={{ y: hovered ? "-110%" : "0%" }} transition={t}>
              {letter}
            </motion.span>
            <motion.span className="absolute inset-0 inline-block" initial={{ y: "110%" }} animate={{ y: hovered ? "0%" : "110%" }} transition={t}>
              {letter}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}
