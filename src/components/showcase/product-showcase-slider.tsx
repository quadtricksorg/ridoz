import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
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
import {
  showcaseProducts,
  showcaseProductsMap,
  type ShowcaseSlide,
  type ShowcaseProductType,
} from "@/data/showcase-slides";
import { FEATURES_BY_PRODUCT, FeatureRow, ShowcaseStage } from "@/components/showcase/showcase-stage-decor";
import { LOOK_TO_RAIL, goToRail } from "@/lib/shop-links";
import { productImageVariants } from "@/data/products";

/** Autoplay: how long each colourway stays, and how long after the last user input it resumes. */
const AUTOPLAY_MS = 2000;
const AUTOPLAY_IDLE_MS = 2500;

/** Fully transparent layers are hidden so they drop out of compositing while scrolling. */
const hiddenWhenClear = (o: number) => (o <= 0.001 ? "hidden" : "visible");

/**
 * Shared transition curves. Every layer of a slide lives in the window |progress − index| ≤ 0.5:
 * the outgoing slide eases out over the first half of a step, the incoming one eases in over the
 * second half. All curves have zero velocity at both ends, so there are no jolts or overshoots.
 */
const STEP_WINDOW = 0.5;
/** Slide-to-slide timing: gentle start, long soft landing. */
const SLIDE_EASE = [0.45, 0.05, 0.25, 1] as const;
const SLIDE_DURATION = 0.95;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** 0 at rest → 1 at the edge of the window. */
const phase = (p: number, index: number) => clamp01(Math.abs(p - index) / STEP_WINDOW);
/** Opacity: fully visible at rest, smoothly gone by the half-step. */
const fadeAt = (p: number, index: number, reduced: boolean) =>
  reduced ? (Math.abs(p - index) < 0.5 ? 1 : 0) : 1 - smoothstep(phase(p, index));
/** Signed offset: slow to start leaving / slow to settle when arriving. */
const driftAt = (p: number, index: number, distance: number, reduced: boolean) => {
  if (reduced) return 0;
  const t = phase(p, index);
  return Math.sign(p - index) * distance * t * t * t;
};

// Lightweight, delicate botanical small flower designs for the moving accent layer
function DelicateBlossomFlower({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      {/* 5 organic curved flower petals */}
      <g fill={color}>
        <circle cx="20" cy="11.5" r="5.5" />
        <circle cx="27.8" cy="17.2" r="5.5" />
        <circle cx="24.8" cy="26.3" r="5.5" />
        <circle cx="15.2" cy="26.3" r="5.5" />
        <circle cx="12.2" cy="17.2" r="5.5" />
      </g>
      {/* Center core and pistil detail */}
      <circle cx="20" cy="20" r="3.2" fill={color} />
      <circle cx="20" cy="20" r="5.5" stroke={color} strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.8" />
    </svg>
  );
}

function BotanicalPetalFlower({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} fill="none" stroke={color} aria-hidden="true">
      {/* Sculpted botanical bloom petals */}
      <path
        d="M18 18 C18 9, 13 4, 18 2 C23 4, 18 9, 18 18 Z"
        fill={color}
      />
      <path
        d="M18 18 C25 15, 30 18, 33 14 C32 20, 27 21, 18 18 Z"
        fill={color}
      />
      <path
        d="M18 18 C22 25, 27 29, 26 34 C21 32, 19 26, 18 18 Z"
        fill={color}
      />
      <path
        d="M18 18 C14 25, 9 29, 10 34 C15 32, 17 26, 18 18 Z"
        fill={color}
      />
      <path
        d="M18 18 C11 15, 6 18, 3 14 C4 20, 9 21, 18 18 Z"
        fill={color}
      />
      <circle cx="18" cy="18" r="2.5" fill={color} />
    </svg>
  );
}

function MiniDaisyFlower({ className, color }: { className?: string; color: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      {/* Delicate 6-petal daisy flower */}
      <g fill={color}>
        <circle cx="16" cy="8" r="3.8" />
        <circle cx="23" cy="12" r="3.8" />
        <circle cx="23" cy="20" r="3.8" />
        <circle cx="16" cy="24" r="3.8" />
        <circle cx="9" cy="20" r="3.8" />
        <circle cx="9" cy="12" r="3.8" />
      </g>
      <circle cx="16" cy="16" r="3" fill={color} />
    </svg>
  );
}

/**
 * SlideTitleBounceLayer Component:
 * Sits directly BEHIND the stationary product bra (z-20 range).
 * Comes from the left fast, overshoots to the right, and bounces back to center!
 * Low-contrast watermark against the dark plain background.
 * Font size is calibrated to fit inside the screen at all widths (mobile 390px, tablet, desktop).
 * Reverses symmetrically when scrolling backward.
 */
function SlideTitleBounceLayer({
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
  // Glides in from the left and settles softly (no overshoot)
  const x = useTransform(progress, (p) => driftAt(p, index, 140, isReducedMotion));
  const opacity = useTransform(progress, (p) => fadeAt(p, index, isReducedMotion));

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[17%] sm:top-[22%] md:top-[23%] lg:top-[23%] -translate-y-1/2 flex items-center justify-center text-center z-20 px-4 will-change-[transform,opacity]"
      style={{ x, opacity, visibility: useTransform(opacity, hiddenWhenClear) }}
    >
      <span
        className="font-sans font-black uppercase tracking-[-0.035em] leading-none whitespace-nowrap select-none max-w-[92vw] overflow-hidden"
        style={{
          // Fits within the screen width comfortably across all devices
          fontSize: "clamp(1.75rem, 6.5vw, 4.75rem)",
          color: `color-mix(in oklab, ${slide.braColor} 35%, var(--foreground) 10%)`,
        }}
      >
        {slide.title}
      </span>
    </motion.div>
  );
}

/**
 * Product pose for a slide at signed distance d = progress − index.
 * The outgoing product drifts left and fades out over the first half of a step; the
 * incoming one fades in from the right over the second half — so two products are
 * never on screen together, and every curve starts and ends at rest.
 */
function productPose(p: number, index: number, reduced: boolean) {
  if (reduced) return { o: Math.abs(p - index) < 0.5 ? 1 : 0, x: 0, s: 1 };
  const t = phase(p, index);
  const e = smoothstep(t);
  return { o: 1 - e, x: -driftAt(p, index, 70, false), s: 1 - 0.05 * e };
}

/**
 * SlideStationaryBraLayer Component:
 * Sits in front of the big title (z-30 range). Only the <img> is transformed
 * (translate / scale / opacity — compositor only); its frame never moves, so the
 * stage decor can measure the resting layout box at any moment.
 */
function SlideStationaryBraLayer({
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
  const opacity = useTransform(progress, (p) => productPose(p, index, isReducedMotion).o);
  const x = useTransform(progress, (p) => productPose(p, index, isReducedMotion).x);
  const scale = useTransform(progress, (p) => productPose(p, index, isReducedMotion).s);
  // Fully transparent layers drop out of compositing.
  const visibility = useTransform(opacity, hiddenWhenClear);
  const hasTransparency = slide.isTransparent !== false;

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${index + 1} of ${totalSlides}: ${slide.productName}`}
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: 30 + index }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-[var(--pc-m)] sm:top-[50%] md:top-[53%] lg:top-[50%] -translate-y-1/2 flex items-center justify-center z-10 px-4">
        <div
          className={`relative flex items-center justify-center ${
            !hasTransparency ? "rounded-3xl border border-border/40 bg-card/30 p-4" : ""
          }`}
        >
          <motion.img
            src={slide.image}
            srcSet={productImageVariants(slide.image).srcSet}
            sizes="(min-width: 1280px) 500px, (min-width: 768px) 440px, (min-width: 640px) 50vw, 72vw"
            alt={slide.alt || slide.productName}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="max-w-[72vw] sm:max-w-[50vw] md:max-w-[420px] lg:max-w-[max(300px,min(440px,calc(100vw-760px)))] xl:max-w-[min(500px,calc(100vw-860px))] h-auto max-h-[var(--ph-m)] sm:max-h-[42vh] md:max-h-[46vh] lg:max-h-[46vh] object-contain select-none will-change-[transform,opacity]"
            style={{ x, scale, opacity, visibility }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductInfoCardItem Component:
 * Cleanly renders the bottom product details & CTA outside the split mask (z-[60]).
 * Comes from the bottom with a spring bounce effect as you scroll into each slide.
 * Uses a non-overlapping opacity window so text from two different slides NEVER blends together!
 * Price is completely omitted per user specification.
 * Reverses smoothly when scrolling backward.
 */
/**
 * ProductSelector Component:
 * Circular product swatches (Bra, Boxer, Panty, Brief) matching the Hero section's design.
 * Lets the user switch between product categories with instant reset to slide 0.
 */
function ProductSelector({
  selectedProduct,
  currentSlide,
  onSelectProduct,
  timer,
  className = "",
}: {
  selectedProduct: ShowcaseProductType;
  currentSlide?: ShowcaseSlide;
  onSelectProduct: (p: ShowcaseProductType) => void;
  /** Autoplay countdown ring on the selected swatch (only for the slide on screen). */
  timer?: { autoplay: boolean; key: string } | undefined;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose innerwear product"
      className={`inline-flex items-center gap-3 rounded-full border border-white/80 bg-[#fdf6f4]/95 px-3 py-2 shadow-[0_10px_30px_-16px_rgba(90,30,50,0.45)] ${className}`}
    >
      {showcaseProducts.map((p) => {
        const isSelected = selectedProduct === p.id;
        // Default color and image matching the first item in the product's slide list
        const defaultSlide = p.slides[0];
        const activeSwatchBg = isSelected && currentSlide ? (currentSlide.swatchBg || currentSlide.braColor) : (defaultSlide?.swatchBg || p.swatchBg || defaultSlide?.braColor);
        const activeThumb = isSelected && currentSlide?.image ? currentSlide.image : (defaultSlide?.image || p.thumb);
        const ringColor = isSelected && currentSlide?.darkColor ? currentSlide.darkColor : "var(--primary)";

        return (
          <span key={p.id} className="relative inline-flex shrink-0">
          {isSelected && (
            // Same countdown ring as the 3-piece box swatches: fills while autoplay counts
            // down to the next colour, and stays full while autoplay is paused.
            <svg
              viewBox="0 0 48 48"
              aria-hidden
              className="pointer-events-none absolute -inset-[6px] h-[calc(100%+12px)] w-[calc(100%+12px)] -rotate-90 lg:-inset-[7px] lg:h-[calc(100%+14px)] lg:w-[calc(100%+14px)]"
            >
              <circle cx="24" cy="24" r="22.5" fill="none" stroke="#2a1216" strokeOpacity={0.12} strokeWidth="1.5" />
              <motion.circle
                key={timer ? `ring-${timer.key}-${timer.autoplay}` : "ring-static"}
                cx="24"
                cy="24"
                r="22.5"
                fill="none"
                stroke={ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: timer?.autoplay ? 0 : 1 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: timer?.autoplay ? AUTOPLAY_MS / 1000 : 0.2, ease: "linear" }}
              />
            </svg>
          )}
          <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${p.label} (${p.tag})`}
            title={`${p.label} - ${p.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(p.id);
            }}
            style={{ backgroundColor: activeSwatchBg }}
            className={`relative flex h-10 w-10 lg:h-11 lg:w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full p-1 transition-all duration-300 ${
              isSelected ? "shadow-sm" : "opacity-75 hover:opacity-100 hover:scale-105"
            }`}
          >
            <img
              src={productImageVariants(activeThumb).thumb}
              alt=""
              decoding="async"
              draggable={false}
              className="h-full w-full object-contain pointer-events-none select-none transition-transform duration-300"
            />
          </button>
          </span>
        );
      })}
    </div>
  );
}

function ProductInfoCardItem({
  slide,
  index,
  progress,
  isReducedMotion,
  onExplore,
  productSelector,
  features,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
  onExplore: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  productSelector?: React.ReactNode;
  features?: React.ReactNode;
}) {
  // Rises softly from below (+36px) and settles without overshoot
  const y = useTransform(progress, (p) =>
    isReducedMotion ? 0 : 36 * Math.pow(phase(p, index), 3),
  );

  // Non-overlapping opacity window: outgoing is fully gone at the half-step
  const opacity = useTransform(progress, (p) => fadeAt(p, index, isReducedMotion));

  const pointerEvents = useTransform(progress, (p) => {
    return Math.abs(p - index) <= 0.35 ? "auto" : "none";
  });

  return (
    <>
      {/* 
        CONTENT CARD:
        - Mobile (< 640px): Centered at the bottom with compact padding so it fits screens cleanly.
        - Other devices (>= 640px): Kept strictly on the LEFT side with scaled typography & padding to prevent any image overlap.
      */}
      <motion.div
        data-slide-stack
        className="absolute z-[60] inset-x-4 bottom-[3.4rem] sm:inset-x-auto sm:left-6 md:left-10 lg:left-14 xl:left-20 sm:bottom-12 md:bottom-16 sm:max-w-[300px] md:max-w-[330px] lg:max-w-[310px] xl:max-w-[340px] will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents, visibility: useTransform(opacity, hiddenWhenClear) }}
      >
        {/* Solid (non-blurred) card: a backdrop blur over moving layers is re-computed every scroll frame */}
        <div className="mx-auto max-w-md sm:max-w-none text-center sm:text-left rounded-3xl border border-white/80 bg-[#fdf6f4]/95 px-4 py-3.5 sm:p-4 md:p-5 lg:px-5 lg:py-4 shadow-[0_18px_44px_-22px_rgba(90,30,50,0.45)]">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 sm:mb-2">
            <span
              className="inline-flex h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: slide.darkColor,
                boxShadow: `0 0 8px ${slide.darkColor}80`,
              }}
            />
            <span
              className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: slide.darkColor }}
            >
              {slide.tag || "Signature Contour"} • 0{index + 1}
            </span>
          </div>

          <h3
            className="font-display text-[1.35rem] sm:text-xl md:text-2xl lg:text-[1.65rem] font-bold tracking-tight leading-tight"
            style={{ color: slide.darkColor }}
          >
            {slide.productName}
          </h3>

          <p className="mt-1 sm:mt-1.5 text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed font-sans max-sm:[@media(max-height:640px)]:hidden sm:[@media(max-height:680px)]:hidden">
            {slide.shortDescription}
          </p>

          {/* Feature icons (hidden on very short phones to keep everything on one screen) */}
          {features && (
            <div className="mt-3 border-t border-[#2a1216]/8 pt-3 max-sm:[@media(max-height:700px)]:hidden">
              {features}
            </div>
          )}
        </div>

        {/* Phones: product selector, then a full-width CTA — below the card */}
        {productSelector && (
          <div className="sm:hidden mt-2.5 flex items-center justify-center pointer-events-auto">
            {productSelector}
          </div>
        )}
        <div className="mt-2.5 flex items-center justify-center sm:hidden">
          <a
            href={slide.link || "#shop"}
            data-look={slide.id}
            onClick={onExplore}
            style={{
              backgroundColor: slide.darkColor,
              color: "#ffffff",
              boxShadow: `0 8px 22px -6px ${slide.darkColor}80`,
            }}
            className="group inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span>{slide.ctaLabel || "Shop This Look"}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </motion.div>

      {/* 
        FLOATING "SHOP THIS LOOK" BUTTON:
        - In other devices (>= 640px), floats on the RIGHT side opposite the content card.
      */}
      <motion.div
        className="hidden sm:flex flex-col items-end gap-3 absolute z-[60] right-6 md:right-10 lg:right-14 xl:right-20 sm:bottom-12 md:bottom-16 will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents, visibility: useTransform(opacity, hiddenWhenClear) }}
      >
        {/* Desktop Product Selector: Positioned JUST ABOVE the button */}
        {productSelector}

        <a
          href={slide.link || "#shop"}
          data-look={slide.id}
          onClick={onExplore}
          style={{
            backgroundColor: slide.darkColor,
            color: "#ffffff",
            boxShadow: `0 6px 20px ${slide.darkColor}45`,
          }}
          className="group inline-flex min-h-11 md:min-h-12 lg:min-h-14 items-center gap-2.5 rounded-full px-5 py-2.5 md:px-6 md:py-3 lg:px-8 text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 hover:brightness-110 active:scale-95 shadow-md md:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span>{slide.ctaLabel || "Shop This Look"}</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </motion.div>
    </>
  );
}

/**
 * FloatingAccentsItem Layer (Unclipped, Top Layer z-[55]):
 * Delicate small flower designs matching the exact color of the bra with low opacity.
 * Moves with parallax bounce from the left, plus gentle continuous ambient drift.
 * Reverses symmetrically when scrolling backward.
 */
function FloatingAccentsItem({
  slide,
  index,
  progress,
  isReducedMotion,
  isActive = true,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
  isActive?: boolean;
}) {
  const x = useTransform(progress, (p) => driftAt(p, index, 110, isReducedMotion));
  const opacity = useTransform(progress, (p) => fadeAt(p, index, isReducedMotion));

  // Small flower designs rendered in the exact bra color with low opacity
  const flowerColor = slide.braColor;

  return (
    <motion.div
      className={`absolute inset-0 h-full w-full pointer-events-none will-change-[transform,opacity] ${
        // Ambient spin/pulse only runs for the slide on screen; neighbours stay still.
        isActive ? "" : "[&_*]:[animation-play-state:paused]"
      }`}
      style={{ x, opacity, visibility: useTransform(opacity, hiddenWhenClear) }}
    >
      {/* 1. Delicate 5-petal blossom top-left */}
      <div className="absolute left-[7%] sm:left-[11%] lg:left-[15%] top-[13%] sm:top-[15%] h-8 w-8 sm:h-11 sm:w-11 opacity-45 animate-[spin_45s_linear_infinite]">
        <DelicateBlossomFlower color={flowerColor} className="h-full w-full rotate-[-15deg]" />
      </div>

      {/* 2. Sculpted botanical flower top-right */}
      <div className="absolute right-[8%] sm:right-[13%] lg:right-[17%] top-[17%] sm:top-[19%] h-9 w-9 sm:h-12 sm:w-12 opacity-40 animate-[spin_55s_linear_infinite_reverse]">
        <BotanicalPetalFlower color={flowerColor} className="h-full w-full" />
      </div>

      {/* 3. Small mini daisy mid-left */}
      <div className="absolute left-[5%] sm:left-[9%] top-[48%] h-5 w-5 sm:h-7 sm:w-7 opacity-40 animate-pulse">
        <MiniDaisyFlower color={flowerColor} className="h-full w-full" />
      </div>

      {/* 4. Delicate blossom mid-right */}
      <div className="absolute right-[9%] sm:right-[14%] top-[54%] h-7 w-7 sm:h-9 sm:w-9 opacity-50 animate-[spin_50s_linear_infinite]">
        <DelicateBlossomFlower color={flowerColor} className="h-full w-full rotate-[35deg]" />
      </div>

      {/* 5. Sculpted botanical flower bottom-left */}
      <div className="absolute left-[13%] sm:left-[21%] bottom-[23%] sm:bottom-[19%] h-9 w-9 sm:h-11 sm:w-11 opacity-40 animate-[spin_60s_linear_infinite]">
        <BotanicalPetalFlower color={flowerColor} className="h-full w-full" />
      </div>

      {/* 6. Mini daisy bottom-right */}
      <div className="absolute right-[13%] sm:right-[19%] bottom-[21%] sm:bottom-[17%] h-6 w-6 sm:h-8 sm:w-8 opacity-45 animate-pulse">
        <MiniDaisyFlower color={flowerColor} className="h-full w-full rotate-[-25deg]" />
      </div>
    </motion.div>
  );
}

/**
 * ProductShowcaseSlider Component
 *
 * A normal full-screen section: the page scrolls past it freely (no pinning, no
 * scroll-jacking), and colourways change only by:
 *  - horizontal touch swipe (phones / tablets),
 *  - mouse click-and-drag or two-finger horizontal trackpad swipe (desktop),
 *  - arrows, dots and ← / → keys,
 *  - autoplay while the section is on screen and the visitor isn't interacting.
 * All slide layers are driven by a single `progress` motion value
 * (zero React re-renders during a transition).
 */
export function ProductShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const activeAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const currentIndexRef = useRef(0);
  currentIndexRef.current = currentIndex;

  const isReducedMotion = useReducedMotion() ?? false;
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProductType>("bra");
  const currentProductItem = showcaseProductsMap[selectedProduct] || showcaseProducts[0]!;
  const activeSlides = currentProductItem.slides;
  const totalSlides = activeSlides.length;

  // Refs mirror the product state so gesture / timer callbacks never read a stale product.
  const selectedProductRef = useRef(selectedProduct);
  selectedProductRef.current = selectedProduct;
  const totalSlidesRef = useRef(totalSlides);
  totalSlidesRef.current = totalSlides;
  /** Bumped on every navigation, so a superseded product hand-off never completes. */
  const navTokenRef = useRef(0);

  // Single unified progress motion value used across the entire component
  const progress = useMotionValue(0);
  const isMouseDraggingRef = useRef(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  /** Last time the visitor interacted with the slider (pauses autoplay for a moment). */
  const lastUserInputRef = useRef(0);
  const markInput = useCallback(() => {
    lastUserInputRef.current = Date.now();
  }, []);

  const handleSelectProduct = (newProduct: ShowcaseProductType) => {
    if (newProduct === selectedProductRef.current) return;
    markInput();
    // Same fade-through hand-off as moving past the last colour, landing on the first colour.
    const ids = showcaseProducts.map((p) => p.id);
    const dir = ids.indexOf(newProduct) > ids.indexOf(selectedProductRef.current) ? 1 : -1;
    crossToProduct(dir, SLIDE_DURATION, newProduct);
  };

  // Synchronize currentIndex from unified progress
  useEffect(() => {
    const unsub = progress.on("change", (latest) => {
      const rounded = Math.max(0, Math.min(totalSlidesRef.current - 1, Math.round(latest)));
      if (rounded !== currentIndexRef.current) {
        currentIndexRef.current = rounded;
        setCurrentIndex(rounded);
      }
    });
    return () => unsub();
  }, [progress]);

  /**
   * Hand-off to the neighbouring product (after its last / before its first colour),
   * looping bra → boxer → panty → brief → bra.
   * Every layer is fully transparent at a half-step (|progress − index| = 0.5), so the
   * current colour plays its normal exit up to ±0.5, the product swaps while nothing is
   * visible, and the new colour plays its normal entrance from ∓0.5. One continuous
   * motion, no extra layers mounted, no flash.
   */
  const crossToProduct = useCallback(
    (dir: 1 | -1, duration: number, targetId?: ShowcaseProductType) => {
      const order = showcaseProducts;
      const from = order.findIndex((p) => p.id === selectedProductRef.current);
      const next = targetId
        ? showcaseProductsMap[targetId]
        : order[(from + dir + order.length) % order.length]!;
      const landing = targetId || dir > 0 ? 0 : next.slides.length - 1;
      const token = ++navTokenRef.current;
      activeAnimationRef.current?.stop();

      const swap = () => {
        if (token !== navTokenRef.current) return;
        selectedProductRef.current = next.id;
        totalSlidesRef.current = next.slides.length;
        currentIndexRef.current = landing;
        setSelectedProduct(next.id);
        setCurrentIndex(landing);
        if (isReducedMotion) {
          progress.set(landing);
          return;
        }
        progress.set(landing - dir * 0.5);
        // Ease-out half: picks up at the speed the exit ended with, then settles softly.
        activeAnimationRef.current = animate(progress, landing, {
          duration: duration * 0.55,
          ease: [0.3, 0.6, 0.25, 1],
        });
      };

      if (isReducedMotion) return swap();
      // Ease-in half: leaves gently, reaches the (invisible) half-step at speed.
      activeAnimationRef.current = animate(progress, currentIndexRef.current + dir * 0.5, {
        duration: duration * 0.45,
        ease: [0.45, 0.05, 0.7, 0.4],
        onComplete: swap,
      });
    },
    [isReducedMotion, progress],
  );

  /** Animate to a slide (dots, arrows, keys, swipes, drags and autoplay all land here). */
  const animateTo = useCallback(
    (newIndex: number, duration = SLIDE_DURATION) => {
      // Past either end of this product's colours → move on to the neighbouring product.
      if (newIndex > totalSlidesRef.current - 1) return crossToProduct(1, duration + 0.1);
      if (newIndex < 0) return crossToProduct(-1, duration + 0.1);
      const target = newIndex;
      navTokenRef.current++;
      setCurrentIndex(target);
      currentIndexRef.current = target;
      activeAnimationRef.current?.stop();
      if (isReducedMotion) {
        progress.set(target);
      } else {
        // Shorter when resuming from a partial drag, so the release never feels sluggish.
        const distance = Math.min(1, Math.abs(target - progress.get()));
        activeAnimationRef.current = animate(progress, target, {
          duration: Math.max(0.45, duration * distance),
          ease: [...SLIDE_EASE],
        });
      }
    },
    [crossToProduct, isReducedMotion, progress],
  );

  /** User-initiated navigation. */
  const goToSlide = useCallback(
    (newIndex: number) => {
      setHasInteracted(true);
      markInput();
      animateTo(newIndex);
    },
    [animateTo, markInput],
  );

  // Keyboard Navigation (← / → only, so ↑ / ↓ / PageUp / PageDown keep scrolling the page)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const container = sliderRef.current;
      if (!container) return;
      const isFocused =
        document.activeElement === container || container.contains(document.activeElement);
      if (!isFocused && !isHovered) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToSlide(currentIndexRef.current - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToSlide(currentIndexRef.current + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToSlide, isHovered]);

  // 1. HORIZONTAL TOUCH SWIPE (PHONES & TABLETS)
  // The section uses `touch-action: pan-y`, so vertical swipes are plain native page
  // scrolling (never intercepted) and horizontal swipes come to us. All listeners are
  // passive — nothing here can block or delay scrolling.
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      markInput();
      tracking = false;
      if (e.touches.length !== 1) return;
      // Let taps on buttons, links, or selector swatches pass through
      if ((e.target as HTMLElement)?.closest?.("button, a, [role='radio'], [role='tab']")) return;
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      // Clearly horizontal gestures only
      if (Math.abs(dx) < 35 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const current = currentIndexRef.current;
      goToSlide(dx < 0 ? current + 1 : current - 1);
    };

    const onTouchCancel = () => {
      tracking = false;
    };

    slider.addEventListener("touchstart", onTouchStart, { passive: true });
    slider.addEventListener("touchend", onTouchEnd, { passive: true });
    slider.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      slider.removeEventListener("touchstart", onTouchStart);
      slider.removeEventListener("touchend", onTouchEnd);
      slider.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [goToSlide, markInput]);

  // 2. MOUSE DRAG + TRACKPAD SWIPE COLOUR NAVIGATION (NON-TOUCH DEVICES):
  // - Click-and-drag left/right on the product display scrubs live between colours
  //   and settles on the next / previous colour on release (one step per drag).
  // - Two-finger horizontal trackpad swipes (and shift+wheel) step exactly one colour per gesture.
  // - Vertical wheel / trackpad scrolling is never touched: the page scrolls normally.
  // - Buttons, links, swatches and dots keep working as plain clicks.
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const DRAG_START_PX = 6;
    const DRAG_COMMIT_PX = 50;
    const isInteractive = (el: EventTarget | null) =>
      !!(el as HTMLElement | null)?.closest?.("button, a, input, select, textarea, [role='radio'], [role='tab']");

    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startIndex = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0; // px per ms
    let dragging = false;
    let suppressClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // touch handled by the touch handlers above
      markInput();
      if (e.button !== 0 || pointerId !== null) return;
      if (isInteractive(e.target)) return;
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = e.clientY;
      lastT = performance.now();
      velocity = 0;
      startIndex = currentIndexRef.current;
      dragging = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_START_PX || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        isMouseDraggingRef.current = true;
        setIsMouseDragging(true);
        setHasInteracted(true);
        activeAnimationRef.current?.stop();
        try {
          slider.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      markInput();
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = now;

      // Live scrub: dragging ~half the section width moves one full colour.
      const width = slider.clientWidth || window.innerWidth;
      const raw = startIndex - dx / (width * 0.5);
      // At the first / last colour the scrub stops at the half-step (fully faded out);
      // releasing there hands off to the neighbouring product.
      const last = totalSlidesRef.current - 1;
      const lo = startIndex > 0 ? startIndex - 1 : -0.5;
      const hi = startIndex < last ? startIndex + 1 : last + 0.5;
      progress.set(Math.max(lo, Math.min(hi, raw)));
    };

    const endDrag = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      try {
        if (slider.hasPointerCapture(e.pointerId)) slider.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!dragging) return;
      dragging = false;
      isMouseDraggingRef.current = false;
      setIsMouseDragging(false);
      suppressClick = true;
      window.setTimeout(() => (suppressClick = false), 0);

      const dx = e.clientX - startX;
      const flick = Math.abs(velocity) > 0.5;
      let target = startIndex;
      if (dx <= -DRAG_COMMIT_PX || (flick && velocity < 0 && dx < 0)) target = startIndex + 1;
      else if (dx >= DRAG_COMMIT_PX || (flick && velocity > 0 && dx > 0)) target = startIndex - 1;
      goToSlide(target);
    };

    // Swallow the click that follows a drag so nothing underneath is activated.
    const onClickCapture = (e: MouseEvent) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick = false;
      }
    };

    // Horizontal trackpad swipe: one colour per gesture (inertia is ignored until it settles).
    let wheelAcc = 0;
    let wheelLocked = false;
    let wheelIdle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX !== 0 ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      // Mostly-vertical wheel: leave it alone so the page scrolls normally.
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      if (e.cancelable) e.preventDefault(); // stop browser back/forward swipe
      markInput();
      if (wheelIdle) clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => {
        wheelLocked = false;
        wheelAcc = 0;
      }, 220);
      if (wheelLocked) return;
      wheelAcc += dx;
      if (Math.abs(wheelAcc) < 40) return;
      const current = currentIndexRef.current;
      const target = wheelAcc > 0 ? current + 1 : current - 1;
      wheelAcc = 0;
      wheelLocked = true;
      goToSlide(target);
    };

    slider.addEventListener("pointerdown", onPointerDown);
    slider.addEventListener("pointermove", onPointerMove);
    slider.addEventListener("pointerup", endDrag);
    slider.addEventListener("pointercancel", endDrag);
    slider.addEventListener("click", onClickCapture, true);
    slider.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      if (wheelIdle) clearTimeout(wheelIdle);
      isMouseDraggingRef.current = false;
      slider.removeEventListener("pointerdown", onPointerDown);
      slider.removeEventListener("pointermove", onPointerMove);
      slider.removeEventListener("pointerup", endDrag);
      slider.removeEventListener("pointercancel", endDrag);
      slider.removeEventListener("click", onClickCapture, true);
      slider.removeEventListener("wheel", onWheel);
    };
  }, [goToSlide, markInput, progress]);

  // 3. AUTOPLAY (colourways change on their own, like the 3-piece box section)
  // Runs only while most of the section is on screen, the tab is visible, motion is
  // allowed and the visitor hasn't touched the slider for AUTOPLAY_IDLE_MS.
  const [inView, setInView] = useState(false);
  const [autoplayActive, setAutoplayActive] = useState(false);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), {
      threshold: 0.55,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || isReducedMotion) {
      setAutoplayActive(false);
      return;
    }
    const tick = () => {
      const eligible =
        !document.hidden &&
        !isMouseDraggingRef.current &&
        Date.now() - lastUserInputRef.current > AUTOPLAY_IDLE_MS;
      setAutoplayActive((prev) => (prev === eligible ? prev : eligible));
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [inView, isReducedMotion]);

  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setTimeout(() => {
      // After the last colour this moves on to the next product (looping after the last product).
      animateTo(currentIndexRef.current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplayActive, currentIndex, selectedProduct, animateTo]);

  // 4. PHONE LAYOUT: measure the bottom stack (card + selector + CTA) once per
  // resize, so the product, podium and arrows share the space above it exactly.
  const [stackH, setStackH] = useState(360);
  useEffect(() => {
    const root = sliderRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const stacks = Array.from(root.querySelectorAll<HTMLElement>("[data-slide-stack]"));
    const measure = () => {
      const h = Math.max(0, ...stacks.map((s) => s.offsetHeight));
      if (h > 0) setStackH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
    };
    const ro = new ResizeObserver(measure);
    stacks.forEach((s) => ro.observe(s));
    measure();
    return () => ro.disconnect();
  }, [activeSlides]);

  /** "Shop this look" → the same garment, in front on the hanger rail (see LOOK_TO_RAIL). */
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    const look = LOOK_TO_RAIL[e.currentTarget.dataset["look"] ?? ""];
    if (look) goToRail(look.target, e);
  };

  return (
    <div id="designs" className="relative w-full">
      <section
        id="showcase-slider"
        ref={sliderRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Innerwear Colorway Showcase Slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative h-[100svh] min-h-[580px] w-full overflow-hidden select-none bg-transparent touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isMouseDragging ? "cursor-grabbing" : "[@media(hover:hover)_and_(pointer:fine)]:cursor-grab"
        }`}
        style={
          {
            // Vertical swipes scroll the page natively; horizontal swipes change colour.
            touchAction: "pan-y pinch-zoom",
            // Phone layout (< 640px): free area between the title and the bottom stack.
            "--stack": `${stackH + 64}px`, // stack + its bottom offset (dots) + gap
            "--t": "calc(17% + 30px)", // just below the big colour word
            "--pod": "60px", // room for the podium under the product
            "--pc-m": "calc(var(--t) + (100% - var(--t) - var(--stack) - var(--pod)) / 2)",
            "--ph-m": "max(120px, calc(100svh - 17svh - 30px - var(--stack) - var(--pod)))",
          } as React.CSSProperties
        }
      >
        {/* Same grain texture as Hero and other sections */}
        <div className="grain absolute inset-0 -z-10 opacity-60 pointer-events-none" />

        {/* 0. STAGE: colour halo, glow arc and podium behind the title and product */}
        <ShowcaseStage slides={activeSlides} currentIndex={currentIndex} />

        {/* 1. BIG TYPOGRAPHY LAYER (Behind the bra, comes from left fast with bounce effect) */}
        {activeSlides.map((slide, idx) => (
          <SlideTitleBounceLayer
            key={`title-${slide.id}`}
            slide={slide}
            index={idx}
            progress={progress}
            isReducedMotion={isReducedMotion}
          />
        ))}

        {/* 2. STATIONARY PRODUCT BRA (Coordinates pixel-locked to center, masked in parallel) */}
        {activeSlides.map((slide, idx) => (
          <SlideStationaryBraLayer
            key={`bra-${slide.id}`}
            slide={slide}
            index={idx}
            totalSlides={totalSlides}
            progress={progress}
            isReducedMotion={isReducedMotion}
          />
        ))}

        {/* 3. UNCLIPPED FLOATING ACCENTS LAYER (Comes from left fast with bounce effect) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[55] overflow-hidden">
          {activeSlides.map((slide, idx) => (
            // All stay mounted (a stable layer tree is cheaper than re-creating layers);
            // only the slide on screen runs its ambient spin/pulse.
            <FloatingAccentsItem
              key={`accents-${slide.id}`}
              slide={slide}
              index={idx}
              progress={progress}
              isReducedMotion={isReducedMotion}
              isActive={inView && idx === currentIndex}
            />
          ))}
        </div>

        {/* 4. CONTENT BOX WITH DETAILS (Comes from bottom with bounce effect, price omitted) */}
        {activeSlides.map((slide, idx) => (
          <ProductInfoCardItem
            key={`card-${slide.id}`}
            slide={slide}
            index={idx}
            progress={progress}
            isReducedMotion={isReducedMotion}
            onExplore={handleExploreClick}
            productSelector={
              <ProductSelector
                selectedProduct={selectedProduct}
                currentSlide={slide}
                onSelectProduct={handleSelectProduct}
                timer={idx === currentIndex ? { autoplay: autoplayActive, key: slide.id } : undefined}
              />
            }
            features={<FeatureRow features={FEATURES_BY_PRODUCT[selectedProduct]} color={slide.darkColor} />}
          />
        ))}

        {/* Navigation Arrows — phones: level with the product; larger screens: vertically centred */}
        <div className="pointer-events-none absolute inset-x-2 top-[var(--pc-m)] h-0 flex items-center justify-between z-[70] sm:inset-x-4 sm:top-0 sm:h-full lg:inset-x-8">
          <button
            type="button"
            aria-label="Previous design slide"
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(currentIndexRef.current - 1);
            }}
            className={`pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/80 bg-[#fdf6f4]/95 text-foreground shadow-[0_8px_24px_-12px_rgba(90,30,50,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-card hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none opacity-90 hover:opacity-100`}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <button
            type="button"
            aria-label="Next design slide"
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(currentIndexRef.current + 1);
            }}
            className={`pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/80 bg-[#fdf6f4]/95 text-foreground shadow-[0_8px_24px_-12px_rgba(90,30,50,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-card hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none opacity-90 hover:opacity-100`}
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>


        {/* Clickable Dots Navigation */}
        <div
          role="tablist"
          aria-label="Showcase slide navigation"
          className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 rounded-full border border-white/80 bg-[#fdf6f4]/95 px-4 py-2 shadow-[0_8px_24px_-12px_rgba(90,30,50,0.4)]"
        >
          {activeSlides.map((slide, idx) => {
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
                className={`relative overflow-hidden rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  isActive ? "h-2.5 w-9 sm:w-10" : "h-2 w-2 sm:h-2.5 sm:w-2.5 bg-foreground/20 hover:bg-foreground/50"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `color-mix(in oklab, ${slide.braColor} 35%, transparent)`,
                        boxShadow: `0 0 10px ${slide.braColor}80`,
                      }
                    : undefined
                }
              >
                {/* Autoplay progress (same idea as the 3-piece box swatch ring); full when paused */}
                {isActive && (
                  <motion.span
                    key={`fill-${slide.id}-${autoplayActive}`}
                    aria-hidden
                    className="absolute inset-0 origin-left rounded-full"
                    style={{ backgroundColor: slide.braColor }}
                    initial={{ scaleX: autoplayActive ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: autoplayActive ? AUTOPLAY_MS / 1000 : 0.2, ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Hint on first view - positioned above the info card so it never overlaps */}
        {!hasInteracted && (
          <div
            className="pointer-events-none absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[70] hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-1.5 backdrop-blur-md text-foreground text-xs font-medium tracking-wide shadow-md"
          >
            <Hand className="h-3.5 w-3.5 text-primary" />
            <span>Drag or swipe sideways to explore colours</span>
          </div>
        )}

        {/* Screen Reader Live Announcement */}
        <div className="sr-only" aria-live="polite">
          Showing slide {currentIndex + 1} of {totalSlides}: {activeSlides[currentIndex]?.productName}
        </div>
      </section>
    </div>
  );
}
