import { useEffect, useState, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import logoRingOnly from "@/assets/logo-ring-only.png";
import logoStyleOnly from "@/assets/logo-style-only.png";

interface IntroLoaderProps {
  onComplete?: () => void;
}

/**
 * Premium circular logo reveal animation for RIDOZ fashion e-commerce.
 *
 * Sequence:
 * Phase 1 (0.0s - 0.88s): Authentic burgundy circular ring progressively reveals via smooth circular SVG mask.
 * Phase 2 (0.55s - 1.10s): Original "Style" script typography reveals with subtle opacity fade & gentle upward drift.
 * Phase 3 (0.95s - 1.48s): Bold, prominent "RIDOZ" brand lettering reveals centered directly beneath.
 * Phase 4 (1.85s - 2.20s): Seamless website transition with smooth opacity fade out.
 */
export function IntroLoader({ onComplete }: IntroLoaderProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(1);
  const [isExiting, setIsExiting] = useState(false);
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `ridoz-ring-reveal-${reactId}`;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("no_intro") === "1" || params.get("skip") === "1") {
        onComplete?.();
        return;
      }
    } catch {
      // In case URLSearchParams is restricted
    }

    // Accessibility: immediate completion for reduced-motion users
    if (reduce) {
      setPhase(3);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Phase 2: Reveal "Style" script text (0.5s)
    const t1 = setTimeout(() => setPhase(2), 500);

    // Phase 3: Reveal "RIDOZ" branding (0.85s)
    const t2 = setTimeout(() => setPhase(3), 850);

    // Phase 4: Begin smooth fade out (1.7s)
    const t3 = setTimeout(() => {
      setIsExiting(true);
    }, 1700);

    // Complete: notify parent after fade out finishes (2.05s)
    const t4 = setTimeout(() => {
      onComplete?.();
    }, 2050);

    // Allow escape key to immediately skip intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onComplete?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reduce, onComplete]);

  return (
    <motion.div
      key="ridoz-intro-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FEFDF8] px-6 select-none overflow-hidden"
      style={{ willChange: "opacity", pointerEvents: isExiting ? "none" : "auto" }}
      aria-label="RIDOZ Style Loading"
      role="status"
    >
          {/* Subtle warm luxury grain overlay */}
          <div className="grain absolute inset-0 -z-10 opacity-40 pointer-events-none" />

          {/* Central Logo Container */}
          <div className="relative flex flex-col items-center justify-center">
            {/*
              Circular Ring + Script Typography
              Refined, elegant scale (~25% smaller than before for luxury proportion)
            */}
            <div className="relative w-[min(48vw,180px)] sm:w-[200px] md:w-[230px] lg:w-[250px] aspect-[1024/985]">
              {/*
                SVG Progressive Reveal Mask:
                Sweeps along the exact circular path from the bottom-left opening,
                clockwise over the top crest, and down to the bottom-right opening.
                Path starts and ends past the cuts with full 240px stroke clearance,
                guaranteeing 100% of the authentic ring graphic is revealed with its
                original circular geometry and clean radial cuts (no rounded horseshoe).
              */}
              <svg
                viewBox="0 0 1024 985"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute inset-0 h-full w-full overflow-visible pointer-events-none"
              >
                <defs>
                  <mask id={maskId}>
                    {/* Background is black (hidden) */}
                    <rect width="1024" height="985" fill="black" />
                    {/* Sweeping progressive stroke revealing the authentic ring */}
                    <motion.path
                      d="M 330 860 A 382 382 0 1 1 692 860"
                      fill="none"
                      stroke="white"
                      strokeWidth={240}
                      strokeLinecap="butt"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 0.88,
                        ease: [0.25, 1, 0.5, 1], // fluid progressive draw
                      }}
                    />
                  </mask>
                </defs>

                {/* Original Ring graphic revealed via progressive mask */}
                <image
                  href={logoRingOnly}
                  width="1024"
                  height="985"
                  mask={`url(#${maskId})`}
                />
              </svg>

              {/*
                Once phase >= 2 (stroke draw completes), render unmasked image as direct overlay
                to ensure 100.0% crisp display identical to Image 1 across all display engines.
              */}
              {phase >= 2 && (
                <img
                  src={logoRingOnly}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
                />
              )}

              {/*
                Original "Style" Script Typography:
                Isolated calligraphy asset containing only the script lettering.
                Reveals in its exact original position within the bottom opening.
              */}
              <motion.img
                src={logoStyleOnly}
                alt="Style"
                draggable={false}
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
              />
            </div>

            {/*
              Phase 3: Bold "RIDOZ" Brand Name Centered Directly Below
              Enlarged to command visual hierarchy with presence and authority
            */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{
                duration: 0.52,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-5 sm:mt-6 md:mt-7 flex flex-col items-center"
            >
              <span className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[0.32em] sm:tracking-[0.36em] text-[#a51538] uppercase select-none pl-[0.32em] sm:pl-[0.36em]">
                RIDOZ
              </span>
            </motion.div>
        </div>
      </motion.div>
  );
}
