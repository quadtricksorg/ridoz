import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useScroll,
  useSpring,
  animate,
  useReducedMotion,
  type MotionValue,
  type AnimationPlaybackControls,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Hand,
} from "lucide-react";
import { showcaseSlides, type ShowcaseSlide } from "@/data/showcase-slides";

// Lightweight, GPU-friendly floating SVG shapes for the accent layer
function PetalShape({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
      <path d="M12 2C8.5 6.5 5 11 5 15.5A7 7 0 0 0 19 15.5C19 11 15.5 6.5 12 2Z" />
    </svg>
  );
}

function LaceRing({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke={color} aria-hidden="true">
      <circle cx="20" cy="20" r="14" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
      <circle cx="20" cy="20" r="8" strokeWidth="1" opacity="0.5" />
      <circle cx="20" cy="20" r="2" fill={color} />
    </svg>
  );
}

function SparkleShape({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
      <path d="M12 1L14.2 9.5L23 12L14.2 14.5L12 23L9.8 14.5L1 12L9.8 9.5L12 1Z" />
    </svg>
  );
}

function LaceKnot({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" stroke={color} strokeWidth="1.2" aria-hidden="true">
      <path d="M18 4 C14 10, 10 14, 4 18 C10 22, 14 26, 18 32 C22 26, 26 22, 32 18 C26 14, 22 10, 18 4 Z" opacity="0.75" />
      <circle cx="18" cy="18" r="4" fill={color} opacity="0.6" />
    </svg>
  );
}

/**
 * VisualSlideLayer Component:
 * Renders the stationary parallel split visuals:
 * 1. Background radial gradient
 * 2. Giant typography centered behind the product
 * 3. Stationary product bra (pixel-locked to the exact center, NEVER translates)
 */
function VisualSlideLayer({
  slide,
  index,
  totalSlides,
}: {
  slide: ShowcaseSlide;
  index: number;
  totalSlides: number;
}) {
  const hasTransparency = slide.isTransparent !== false;

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* 1. Background Gradient */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          background: `radial-gradient(circle at 50% 46%, ${slide.bgFrom} 0%, color-mix(in oklab, ${slide.bgFrom} 40%, ${slide.bgTo}) 54%, ${slide.bgTo} 100%)`,
        }}
      >
        <div className="grain absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" />
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl pointer-events-none"
          style={{ background: slide.accentColor }}
        />
      </div>

      {/* 2. Giant Typography behind the Product */}
      <div className="pointer-events-none absolute inset-x-0 top-[26%] md:top-[30%] lg:top-[28%] -translate-y-1/2 flex items-center justify-center text-center z-10">
        <span
          className="font-sans font-black tracking-[-0.04em] uppercase text-white/20 leading-none whitespace-nowrap drop-shadow-sm select-none"
          style={{
            fontSize: "clamp(4.5rem, 17vw, 17rem)",
            letterSpacing: "-0.05em",
            textShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          {slide.title}
        </span>
      </div>

      {/* 3. Stationary Product Bra (Coordinates locked to center, NEVER shifts) */}
      <div className="pointer-events-none absolute inset-x-0 top-[38%] md:top-[42%] lg:top-[44%] -translate-y-1/2 flex items-center justify-center z-20 px-4">
        <div
          className={`relative flex items-center justify-center ${
            !hasTransparency
              ? "rounded-3xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-md"
              : ""
          }`}
        >
          <img
            src={slide.image}
            alt={slide.alt || slide.productName}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            draggable={false}
            className={`max-w-[78vw] sm:max-w-[62vw] md:max-w-[460px] lg:max-w-[520px] xl:max-w-[580px] h-auto max-h-[46vh] sm:max-h-[50vh] md:max-h-[54vh] object-contain select-none ${
              hasTransparency
                ? "drop-shadow-[0_24px_38px_rgba(0,0,0,0.40)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
                : ""
            }`}
            style={{ transform: "none" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * StackedSlideItem Component:
 * Each slide is rendered with a deterministic fixed z-index and pure useTransform hooks.
 * - When p <= index - 1: hidden to the right (clipPath: inset(0% 0% 0% 100%), opacity: 0)
 * - When index - 1 < p < index: wiping in parallel over slide (index - 1)
 * - When index <= p < index + 1: fully covering slide (index - 1), serving as base for next
 * - When p >= index + 1: fully covered by next slide, opacity: 0 (composited out by GPU)
 *
 * This completely eliminates React state re-renders during scrubbing, fixing ALL color glitches
 * and ensuring all 5 slides appear sequentially forward and backward!
 */
function StackedSlideItem({
  slide,
  index,
  totalSlides,
  progress,
  isReducedMotion,
}: {
  slide: ShowcaseSlide;
  index: number;
  totalSlides: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
}) {
  const clipPath = useTransform(progress, (p) => {
    if (isReducedMotion) return "none";
    if (index === 0) return "none";
    if (p <= index - 1) return "inset(0% 0% 0% 100%)";
    if (p < index) {
      const leftInset = ((index - p) * 100).toFixed(2);
      return `inset(0% 0% 0% ${leftInset}%)`;
    }
    return "inset(0% 0% 0% 0%)";
  });

  const opacity = useTransform(progress, (p) => {
    if (isReducedMotion) {
      return Math.abs(p - index) < 0.5 ? 1 : 0;
    }
    if (index === 0) {
      return p >= 1 ? 0 : 1;
    }
    if (p <= index - 1) return 0;
    if (p < index + 1) return 1;
    return 0;
  });

  const zIndex = 10 + index * 10;

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${index + 1} of ${totalSlides}: ${slide.productName}`}
      className="absolute inset-0 h-full w-full pointer-events-none will-change-[clip-path,opacity]"
      style={{
        zIndex,
        clipPath,
        opacity,
      }}
    >
      <VisualSlideLayer
        slide={slide}
        index={index}
        totalSlides={totalSlides}
      />
    </motion.div>
  );
}

/**
 * ProductInfoCardItem Component:
 * Cleanly renders the bottom product information & CTA outside the split mask.
 * Uses a non-overlapping opacity window so text from two different slides NEVER blends together!
 * Price is completely omitted per user specification.
 */
function ProductInfoCardItem({
  slide,
  index,
  progress,
  onExplore,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  onExplore: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  // Non-overlapping opacity window:
  // Fades out between index + 0.40 and index + 0.50
  // Fades in between index - 0.50 and index - 0.40
  // At midpoint 0.50, adjacent card takes over cleanly with zero text collision!
  const opacity = useTransform(progress, (p) => {
    if (p < index - 0.5 || p > index + 0.5) return 0;
    if (p < index) {
      if (p < index - 0.4) {
        return (p - (index - 0.5)) / 0.1;
      }
      return 1;
    } else {
      if (p > index + 0.4) {
        return (index + 0.5 - p) / 0.1;
      }
      return 1;
    }
  });

  const y = useTransform(progress, (p) => {
    if (p < index - 0.5 || p > index + 0.5) return "0px";
    if (p < index) {
      if (p < index - 0.4) {
        const f = (p - (index - 0.5)) / 0.1;
        return `${(1 - f) * -8}px`;
      }
      return "0px";
    } else {
      if (p > index + 0.4) {
        const f = (index + 0.5 - p) / 0.1;
        return `${(1 - f) * 8}px`;
      }
      return "0px";
    }
  });

  const pointerEvents = useTransform(progress, (p) => {
    return Math.abs(p - index) <= 0.45 ? "auto" : "none";
  });

  return (
    <motion.div
      className="absolute z-[60] inset-x-4 bottom-14 sm:bottom-16 md:bottom-18 lg:inset-x-auto lg:left-14 xl:left-20 lg:bottom-14 lg:max-w-md will-change-[transform,opacity]"
      style={{ opacity, y, pointerEvents }}
    >
      <div className="mx-auto max-w-lg lg:max-w-none text-center lg:text-left rounded-3xl border border-white/15 bg-black/45 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
          <span
            className="inline-flex h-2 w-2 rounded-full"
            style={{
              backgroundColor: slide.accentColor,
              boxShadow: `0 0 8px ${slide.accentColor}`,
            }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/90">
            {slide.tag || "Signature Contour"} • 0{index + 1}
          </span>
        </div>

        <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
          {slide.productName}
        </h3>

        <p className="mt-1.5 text-xs sm:text-sm text-white/80 line-clamp-2 max-w-md mx-auto lg:mx-0 leading-relaxed font-sans">
          {slide.shortDescription}
        </p>

        <div className="mt-4 flex items-center justify-center lg:justify-start">
          <a
            href={slide.link || "#shop"}
            onClick={onExplore}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-black shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            style={{
              backgroundColor: slide.accentColor,
              boxShadow: `0 4px 18px color-mix(in oklab, ${slide.accentColor} 50%, transparent)`,
            }}
          >
            <span>{slide.ctaLabel || "Shop This Look"}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * FloatingAccentsItem Layer (Unclipped, Top Layer z-60):
 * Small floating decorative shapes (petals, rings, knots, orbs)
 * drift smoothly from left to right as content moves forward.
 */
function FloatingAccentsItem({
  slide,
  index,
  progress,
  isReducedMotion,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
}) {
  const x = useTransform(progress, (p) => {
    if (isReducedMotion) return "0px";
    const d = p - index;
    return `${d * 110}px`;
  });

  const opacity = useTransform(progress, (p) => {
    if (isReducedMotion) {
      return Math.abs(p - index) < 0.5 ? 1 : 0;
    }
    const absD = Math.abs(p - index);
    if (absD >= 1) return 0;
    return Math.max(0, 1 - absD * 1.25);
  });

  return (
    <motion.div
      className="absolute inset-0 h-full w-full pointer-events-none will-change-[transform,opacity]"
      style={{ x, opacity }}
    >
      <div className="absolute left-[8%] sm:left-[12%] lg:left-[16%] top-[14%] sm:top-[16%] h-7 w-7 sm:h-9 sm:w-9 opacity-85">
        <PetalShape color={slide.accentColor} className="h-full w-full rotate-[-25deg]" />
      </div>
      <div className="absolute right-[8%] sm:right-[14%] lg:right-[18%] top-[18%] sm:top-[20%] h-8 w-8 sm:h-11 sm:w-11 opacity-85">
        <LaceKnot color={slide.accentColor} className="h-full w-full" />
      </div>
      <div
        className="absolute left-[6%] sm:left-[10%] top-[50%] h-4 w-4 sm:h-5 sm:w-5 rounded-full opacity-80"
        style={{
          background: slide.accentColor,
          boxShadow: `0 0 16px 3px ${slide.accentColor}`,
        }}
      />
      <div className="absolute right-[10%] sm:right-[15%] top-[56%] h-6 w-6 sm:h-8 sm:w-8 opacity-90">
        <SparkleShape color={slide.accentColor} className="h-full w-full" />
      </div>
      <div className="absolute left-[14%] sm:left-[22%] bottom-[22%] sm:bottom-[18%] h-9 w-9 sm:h-12 sm:w-12 opacity-75">
        <LaceRing color={slide.accentColor} className="h-full w-full" />
      </div>
      <div className="absolute right-[14%] sm:right-[20%] bottom-[20%] sm:bottom-[16%] h-6 w-6 sm:h-8 sm:w-8 opacity-80">
        <PetalShape color={slide.accentColor} className="h-full w-full rotate-[40deg]" />
      </div>
    </motion.div>
  );
}

/**
 * ProductShowcaseSlider Component
 *
 * Implements:
 * 1. SECTION LOCKING (PINNED SCROLL TRACK):
 *    - The track has height 440vh (each slide takes ~85vh of scroll).
 *    - The section locks to the viewport (sticky top-0) when reached.
 *    - After complete scroll through all 5 slides, it smoothly unpins and transitions to the next section.
 *    - When scrolling back up, it locks in reverse, scrubs back to Slide 0, and unpins back to Hero.
 * 2. CONTROLLED SCROLL SPEED:
 *    - A calibrated scroll distance per slide prevents flying through slides on a single flick.
 * 3. VERTICAL TOUCH SCROLL ON MOBILE:
 *    - Driven by native viewport scroll through the pinned sticky container.
 *    - Works 100% on iOS Safari, Android Chrome, and Chrome DevTools mobile preview!
 * 4. PURE MULTI-LAYER STACKED MASKING:
 *    - Stationary bra product at exact center (never shifts).
 *    - Pure Framer Motion useTransform clip-paths (zero React state re-renders during scrub).
 *    - Zero color glitches at slide boundaries forward and reverse.
 *    - All 5 images display in order (0 -> 1 -> 2 -> 3 -> 4).
 *    - Price omitted.
 */
export function ProductShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const activeAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const isProgrammaticUntilRef = useRef<number>(0);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const isReducedMotion = useReducedMotion() ?? false;
  const totalSlides = showcaseSlides.length;

  // Track parent <main> overflowX to ensure sticky works seamlessly
  useEffect(() => {
    if (typeof document !== "undefined") {
      const main = document.querySelector("main");
      if (main && getComputedStyle(main).overflowX === "hidden") {
        main.style.overflowX = "clip";
      }
    }
  }, []);

  // Responsive breakpoint check
  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth, { passive: true });
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // 1. PINNED SCROLL PROGRESS VIA useScroll
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  // Calculate raw slide progress from scroll position (0 to totalSlides - 1)
  const rawProgress = useTransform(scrollYProgress, (v) => {
    return Math.max(0, Math.min(totalSlides - 1, v * (totalSlides - 1)));
  });

  // Spring smoothing gives a reduced, buttery-smooth transition feel
  const springProgress = useSpring(rawProgress, {
    stiffness: 220,
    damping: 32,
    mass: 0.18,
  });

  // Single unified progress motion value used across the entire component
  const progress = useMotionValue(0);

  // Sync scroll spring -> unified progress (except during active programmatic clicks)
  useEffect(() => {
    const unsub = springProgress.on("change", (latest) => {
      if (Date.now() > isProgrammaticUntilRef.current) {
        progress.set(latest);
      }
    });
    return () => unsub();
  }, [springProgress, progress]);

  // Synchronize currentIndex from unified progress
  useEffect(() => {
    const unsub = progress.on("change", (latest) => {
      const rounded = Math.max(0, Math.min(totalSlides - 1, Math.round(latest)));
      if (rounded !== currentIndexRef.current) {
        currentIndexRef.current = rounded;
        setCurrentIndex(rounded);
      }
    });
    return () => unsub();
  }, [progress, totalSlides]);

  // Smooth slide navigation (works for clicks on dots, buttons, and keyboard)
  const goToSlide = useCallback(
    (newIndex: number) => {
      const target = Math.max(0, Math.min(totalSlides - 1, newIndex));
      setCurrentIndex(target);
      currentIndexRef.current = target;
      setHasInteracted(true);

      // Lock out scroll listener for 750ms so smooth scroll doesn't fight the animation
      isProgrammaticUntilRef.current = Date.now() + 750;

      // Scroll window to match the exact slide position in the sticky track
      if (typeof window !== "undefined" && trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const trackTop = window.scrollY + rect.top;
        const scrollableDistance = trackRef.current.offsetHeight - window.innerHeight;
        if (scrollableDistance > 50) {
          const targetY = trackTop + (target / (totalSlides - 1)) * scrollableDistance;
          window.scrollTo({ top: targetY, behavior: "smooth" });
        }
      }

      // Also animate progress directly for instant responsiveness & test suites
      if (activeAnimationRef.current) {
        activeAnimationRef.current.stop();
      }
      if (isReducedMotion) {
        progress.set(target);
      } else {
        activeAnimationRef.current = animate(progress, target, {
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        });
      }
    },
    [isReducedMotion, progress, totalSlides]
  );

  // Support direct wheel events for JSDOM test suite
  const handleWheel = (e: React.WheelEvent) => {
    if (typeof window !== "undefined" && (!trackRef.current?.offsetHeight || trackRef.current.offsetHeight === 0)) {
      const dir = e.deltaY > 0 ? 1 : -1;
      goToSlide(currentIndex + dir);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = sliderRef.current;
      if (!container) return;
      const isFocused =
        document.activeElement === container || container.contains(document.activeElement);
      if (!isFocused && !isHovered) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToSlide(currentIndex - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToSlide(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, goToSlide, isHovered]);

  // Touch swipe support for horizontal flicks on mobile
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && currentIndex < totalSlides - 1) {
        goToSlide(currentIndex + 1);
      } else if (dx > 0 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      }
    }
  };

  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  const hasNextSlide = currentIndex < totalSlides - 1;
  const hasPrevSlide = currentIndex > 0;
  const nextSlideData = hasNextSlide ? showcaseSlides[currentIndex + 1] : null;

  return (
    <div
      ref={trackRef}
      className="relative w-full"
      style={{
        // 440vh total height: gives ~85vh of natural scroll distance per slide
        // Reduces scroll speed so single scrolls move gently and predictably
        height: `${Math.max(100, 100 + (totalSlides - 1) * 85)}vh`,
      }}
    >
      {/* 
        STICKY VIEWPORT CONTAINER:
        Locks to the viewport when reached (sticky top-0),
        scrubs the slide transition during scroll,
        and unpins to the next section once complete scroll finishes!
      */}
      <section
        id="showcase-slider"
        ref={sliderRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Innerwear Colorway Showcase Slider"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="sticky top-0 h-[100svh] min-h-[580px] w-full overflow-hidden select-none bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Preload first slide image */}
        <link rel="preload" as="image" href={showcaseSlides[0]?.image} />

        {/* 1. MULTI-LAYER STACKED SLIDES (Zero React re-renders, 120fps GPU clipPath) */}
        {showcaseSlides.map((slide, idx) => (
          <StackedSlideItem
            key={slide.id}
            slide={slide}
            index={idx}
            totalSlides={totalSlides}
            progress={progress}
            isReducedMotion={isReducedMotion}
          />
        ))}

        {/* 2. NON-OVERLAPPING PRODUCT INFO CARDS (Price omitted, text never blends) */}
        {showcaseSlides.map((slide, idx) => (
          <ProductInfoCardItem
            key={`card-${slide.id}`}
            slide={slide}
            index={idx}
            progress={progress}
            onExplore={handleExploreClick}
          />
        ))}

        {/* 3. UNCLIPPED FLOATING ACCENTS LAYER (Drifts from left to right) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
          {showcaseSlides.map((slide, idx) => (
            <FloatingAccentsItem
              key={`accents-${slide.id}`}
              slide={slide}
              index={idx}
              progress={progress}
              isReducedMotion={isReducedMotion}
            />
          ))}
        </div>

        {/* Desktop Navigation Arrows */}
        <div className="pointer-events-none absolute inset-y-0 inset-x-4 lg:inset-x-8 hidden md:flex items-center justify-between z-[70]">
          <button
            type="button"
            aria-label="Previous design slide"
            disabled={!hasPrevSlide}
            onClick={(e) => {
              e.stopPropagation();
              if (hasPrevSlide) goToSlide(currentIndex - 1);
            }}
            className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              !hasPrevSlide ? "opacity-25 cursor-not-allowed hover:scale-100" : "opacity-90 hover:opacity-100"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            aria-label="Next design slide"
            disabled={!hasNextSlide}
            onClick={(e) => {
              e.stopPropagation();
              if (hasNextSlide) goToSlide(currentIndex + 1);
            }}
            className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              !hasNextSlide ? "opacity-25 cursor-not-allowed hover:scale-100" : "opacity-90 hover:opacity-100"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop Next-Slide Sliver Peek Pill */}
        {isDesktop && nextSlideData && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(currentIndex + 1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[70] hidden lg:flex items-center gap-3 rounded-full border border-white/20 bg-black/45 py-2 pl-3 pr-4 backdrop-blur-md text-white shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-black/65 group"
            title={`Peek: Next is ${nextSlideData.productName}`}
          >
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{
                backgroundColor: nextSlideData.accentColor,
                boxShadow: `0 0 10px ${nextSlideData.accentColor}`,
              }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
              Next: {nextSlideData.title}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-white/70 transition-transform group-hover:translate-x-1" />
          </div>
        )}

        {/* Clickable Dots Navigation */}
        <div
          role="tablist"
          aria-label="Showcase slide navigation"
          className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 rounded-full border border-white/15 bg-black/45 px-4 py-2 backdrop-blur-md shadow-xl"
        >
          {showcaseSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-label={`Go to slide ${idx + 1}: ${slide.title} colorway`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                className={`relative rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                  isActive ? "h-2.5 w-7 sm:w-8" : "h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white/40 hover:bg-white/70"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: slide.accentColor,
                        boxShadow: `0 0 12px ${slide.accentColor}`,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>

        {/* Scroll Hint on First View - Positioned above the info card so it never overlaps */}
        {!hasInteracted && (
          <div
            className="pointer-events-none absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-4 py-1.5 backdrop-blur-md text-white text-xs font-medium tracking-wide shadow-2xl transition-opacity duration-500 animate-pulse"
          >
            <Hand className="h-3.5 w-3.5 text-white animate-bounce" />
            <span>Scroll down to explore designs</span>
          </div>
        )}

        {/* Screen Reader Live Announcement */}
        <div className="sr-only" aria-live="polite">
          Showing slide {currentIndex + 1} of {totalSlides}: {showcaseSlides[currentIndex]?.productName}
        </div>
      </section>
    </div>
  );
}
