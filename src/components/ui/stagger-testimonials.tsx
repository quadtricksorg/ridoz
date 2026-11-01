"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnet } from "@/components/ui/magnetic";

export type Testimonial = {
  testimonial: string;
  by: string;
  /** Optional portrait; initials are shown when omitted. */
  imgSrc?: string;
};

const MAX_VISIBLE = 2;

export const StaggerTestimonials: React.FC<{ testimonials: Testimonial[]; className?: string }> = ({
  testimonials,
  className,
}) => {
  const count = testimonials.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cardWidth, setCardWidth] = useState(340);
  const reduce = useReducedMotion();

  const go = (steps: number) => setActive((a) => (((a + steps) % count) + count) % count);

  useEffect(() => {
    const update = () => setCardWidth(window.matchMedia("(min-width: 640px)").matches ? 340 : 260);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (paused || reduce || count < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), 6000);
    return () => clearInterval(t);
  }, [paused, reduce, count, active]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn("relative h-[420px] w-full overflow-hidden bg-muted/40", className)}
    >
      <p className="sr-only" aria-live="polite">
        Review {active + 1} of {count}
      </p>
      {testimonials.map((t, i) => {
        let pos = i - active;
        if (pos > count / 2) pos -= count;
        if (pos < -count / 2) pos += count;
        const isActive = pos === 0;
        const visible = Math.abs(pos) <= MAX_VISIBLE;
        const name = t.by.split(",")[0] ?? t.by;
        return (
          <motion.div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!isActive}
            onClick={() => !isActive && go(pos)}
            drag={isActive ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.x < -45 || info.velocity.x < -300) go(1);
              else if (info.offset.x > 45 || info.velocity.x > 300) go(-1);
            }}
            initial={false}
            animate={{
              x: pos * cardWidth * 0.72,
              y: isActive ? -14 : Math.abs(pos) * 12,
              rotate: isActive ? 0 : pos * 3,
              scale: isActive ? 1 : 0.9 - (Math.abs(pos) - 1) * 0.05,
              opacity: visible ? (isActive ? 1 : 0.85) : 0,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            style={{
              width: cardWidth,
              marginLeft: -cardWidth / 2,
              zIndex: 10 - Math.abs(pos),
              pointerEvents: visible ? "auto" : "none",
            }}
            className={cn(
              "absolute left-1/2 top-12 flex h-[270px] cursor-pointer flex-col rounded-[1.75rem] border p-7 will-change-transform",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-soft"
                : "border-border bg-card text-card-foreground",
            )}
          >
            <Quote aria-hidden className={cn("h-7 w-7", isActive ? "text-accent" : "text-gold")} />
            <div className="mt-3 flex gap-1 text-gold" role="img" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, k) => (
                <motion.span
                  key={`${k}-${isActive ? "active" : "inactive"}`}
                  initial={
                    isActive
                      ? { scale: 0.85, opacity: 0.8, filter: "drop-shadow(0 0 0px rgba(250, 204, 21, 0))" }
                      : { scale: 1, opacity: 1, filter: "none" }
                  }
                  animate={
                    isActive
                      ? {
                          scale: [0.85, 1.45, 0.95, 1.15, 1],
                          opacity: 1,
                          rotate: [0, -10, 8, 0],
                          filter: [
                            "drop-shadow(0 0 0px rgba(250, 204, 21, 0))",
                            "drop-shadow(0 0 10px rgba(250, 204, 21, 0.95))",
                            "drop-shadow(0 0 4px rgba(250, 204, 21, 0.6))",
                            "drop-shadow(0 0 1px rgba(250, 204, 21, 0.3))",
                          ],
                        }
                      : { scale: 1, opacity: 1, rotate: 0, filter: "none" }
                  }
                  transition={
                    isActive
                      ? {
                          duration: 0.65,
                          delay: 0.08 + k * 0.07,
                          ease: [0.34, 1.56, 0.64, 1],
                        }
                      : { duration: 0.2 }
                  }
                  className="inline-flex origin-center"
                >
                  <Star className={cn("h-3.5 w-3.5 fill-current", isActive && "text-accent")} />
                </motion.span>
              ))}
            </div>
            <blockquote className="mt-4 font-display text-[1.6rem] font-semibold leading-[1.1]">{t.testimonial}</blockquote>
            <div className="mt-auto flex items-center gap-3">
              {t.imgSrc ? (
                <img src={t.imgSrc} alt="" className="h-10 w-10 rounded-full object-cover object-top" />
              ) : (
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-display text-xl font-bold",
                    isActive ? "bg-accent text-accent-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {name.charAt(0)}
                </span>
              )}
              <div className="min-w-0 text-sm leading-tight">
                <p className="truncate font-semibold">{name}</p>
                <p className={cn("truncate text-xs", isActive ? "text-primary-foreground/75" : "text-muted-foreground")}>
                  {t.by.slice(name.length + 2)}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <Magnet strength={0.4}>
        <button
          onClick={() => go(-1)}
          aria-label="Previous review"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        </Magnet>
        <div className="flex gap-1">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show review ${i + 1}`}
              aria-current={i === active}
              className="flex h-6 w-6 cursor-pointer items-center justify-center"
            >
              <motion.span
                animate={{ width: i === active ? 24 : 8, backgroundColor: i === active ? "var(--primary)" : "var(--border)" }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="block h-2 rounded-full"
              />
            </button>
          ))}
        </div>
        <Magnet strength={0.4}>
        <button
          onClick={() => go(1)}
          aria-label="Next review"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        </Magnet>
      </div>
    </div>
  );
};
