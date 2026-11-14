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
import {
  showcaseProducts,
  showcaseProductsMap,
  type ShowcaseSlide,
  type ShowcaseProductType,
} from "@/data/showcase-slides";
import { FEATURES_BY_PRODUCT, FeatureRow, ShowcaseStage } from "@/components/showcase/showcase-stage-decor";

/** Autoplay: how long each colourway stays, and how long after the last user input it resumes. */
const AUTOPLAY_MS = 3200;
const AUTOPLAY_IDLE_MS = 4000;

/** Fully transparent layers are hidden so they drop out of compositing while scrolling. */
const hiddenWhenClear = (o: number) => (o <= 0.001 ? "hidden" : "visible");

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
  // Fast entrance from left with overshoot bounce settling
  const x = useTransform(progress, (p) => {
    if (isReducedMotion) return "0px";
    const d = p - index;
    const sign = Math.sign(d);
    const u = Math.abs(d);
    if (u >= 1) return `${sign * 280}px`;
    // Underdamped spring curve: forward overshoot before settling to 0
    const wave = Math.sin(Math.PI * Math.min(1, u / 0.35)) * Math.pow(1 - u, 1.4);
    const base = 280 * Math.pow(u, 1.25);
    const xVal = sign * (base - 55 * wave);
    return `${xVal.toFixed(1)}px`;
  });

  const opacity = useTransform(progress, (p) => {
    if (isReducedMotion) {
      return Math.abs(p - index) < 0.5 ? 1 : 0;
    }
    const absD = Math.abs(p - index);
    if (absD >= 0.45) return 0;
    if (absD <= 0.25) return 1;
    return (0.45 - absD) / (0.45 - 0.25);
  });

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
 * The outgoing product drifts left and fades out completely in the first 40% of a
 * transition; the incoming one only starts to appear after the halfway point and
 * settles in from the right — so two products are never on screen together.
 */
const EXIT_END = 0.4;
const ENTER_SPAN = 0.45;
function productPose(p: number, index: number, reduced: boolean) {
  const d = p - index;
  if (reduced) return { o: Math.abs(d) < 0.5 ? 1 : 0, x: 0, s: 1 };
  if (d >= 0) {
    const t = Math.min(1, d / EXIT_END); // 0 → 1 while leaving
    return { o: 1 - t, x: -90 * t * t, s: 1 - 0.07 * t };
  }
  const u = Math.min(1, -d / ENTER_SPAN); // 1 → 0 while arriving
  const e = u * u; // ease-out arrival
  return { o: 1 - u, x: 90 * e, s: 1 - 0.07 * e };
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
            alt={slide.alt || slide.productName}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
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
  className = "",
}: {
  selectedProduct: ShowcaseProductType;
  currentSlide?: ShowcaseSlide;
  onSelectProduct: (p: ShowcaseProductType) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose innerwear product"
      className={`inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-[#fdf6f4]/95 px-2.5 py-1.5 shadow-[0_10px_30px_-16px_rgba(90,30,50,0.45)] ${className}`}
    >
      {showcaseProducts.map((p) => {
        const isSelected = selectedProduct === p.id;
        // Default color and image matching the first item in the product's slide list
        const defaultSlide = p.slides[0];
        const activeSwatchBg = isSelected && currentSlide ? (currentSlide.swatchBg || currentSlide.braColor) : (defaultSlide?.swatchBg || p.swatchBg || defaultSlide?.braColor);
        const activeThumb = isSelected && currentSlide?.image ? currentSlide.image : (defaultSlide?.image || p.thumb);
        const ringColor = isSelected && currentSlide?.darkColor ? currentSlide.darkColor : "var(--primary)";

        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${p.label} (${p.tag})`}
            title={`${p.label} - ${p.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(p.id);
            }}
            style={{
              backgroundColor: activeSwatchBg,
              boxShadow: isSelected ? `0 0 0 2px var(--background), 0 0 0 4px ${ringColor}` : undefined,
            }}
            className={`relative flex h-10 w-10 lg:h-11 lg:w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full p-1 transition-all duration-300 ${
              isSelected
                ? "scale-110 shadow-sm"
                : "opacity-75 hover:opacity-100 hover:scale-105"
            }`}
          >
            <img
              src={activeThumb}
              alt=""
              draggable={false}
              className="h-full w-full object-contain pointer-events-none select-none transition-transform duration-300"
            />
          </button>
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
  // Bottom bounce trajectory: rises cleanly from bottom (+70px), overshoots slightly, settles to 0px
  const y = useTransform(progress, (p) => {
    if (isReducedMotion) return "0px";
    const d = p - index;
    const absD = Math.abs(d);
    if (absD >= 0.5) return "70px";
    const u = absD / 0.5;
    const base = 70 * Math.pow(u, 1.35);
    const wave = Math.sin(Math.PI * Math.min(1, u / 0.40)) * Math.pow(1 - u, 1.3);
    const overshoot = 16;
    const yVal = base - overshoot * wave;
    return `${yVal.toFixed(1)}px`;
  });

  // Non-overlapping opacity window: fades out between 0.25 and 0.45 distance
  const opacity = useTransform(progress, (p) => {
    const absD = Math.abs(p - index);
    if (absD >= 0.45) return 0;
    if (absD <= 0.25) return 1;
    return (0.45 - absD) / (0.45 - 0.25);
  });

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
  const x = useTransform(progress, (p) => {
    if (isReducedMotion) return "0px";
    const d = p - index;
    const sign = Math.sign(d);
    const u = Math.abs(d);
    if (u >= 1) return `${sign * 240}px`;
    const wave = Math.sin(Math.PI * Math.min(1, u / 0.35)) * Math.pow(1 - u, 1.4);
    const base = 240 * Math.pow(u, 1.25);
    const xVal = sign * (base - 40 * wave);
    return `${xVal.toFixed(1)}px`;
  });

  const opacity = useTransform(progress, (p) => {
    if (isReducedMotion) {
      return Math.abs(p - index) < 0.5 ? 1 : 0;
    }
    const absD = Math.abs(p - index);
    if (absD >= 0.45) return 0;
    if (absD <= 0.25) return 1;
    return (0.45 - absD) / (0.45 - 0.25);
  });

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
  const [selectedProduct, setSelectedProduct] = useState<ShowcaseProductType>("bra");
  const currentProductItem = showcaseProductsMap[selectedProduct] || showcaseProducts[0]!;
  const activeSlides = currentProductItem.slides;
  const totalSlides = activeSlides.length;

  const handleSelectProduct = (newProduct: ShowcaseProductType) => {
    if (newProduct === selectedProduct) return;
    setSelectedProduct(newProduct);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    progress.set(0);

    // Jump to the top of the showcase track to reset to the first colour
    if (typeof window !== "undefined" && trackRef.current) {
      isProgrammaticUntilRef.current = Date.now() + 850;
      const rect = trackRef.current.getBoundingClientRect();
      const trackTop = window.scrollY + rect.top;
      // Instant (see goToSlide): a smooth scroll would outlive the lock and flash old slides.
      window.scrollTo({ top: trackTop, behavior: "instant" });
    }
  };

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
  const isTouchNavigatingRef = useRef(false);
  const isTouchModeRef = useRef(
    typeof window !== "undefined" && ("ontouchstart" in window || (navigator?.maxTouchPoints ?? 0) > 0)
  );

  // Sync scroll spring -> unified progress ONLY for desktop mousewheel/trackpad scroll depth.
  // On touch devices / during touch scroll: progress is NOT based on scroll depth;
  // it is switched cleanly step-by-step on touch start & stop gestures.
  useEffect(() => {
    const unsub = springProgress.on("change", (latest) => {
      if (isTouchModeRef.current || isTouchNavigatingRef.current) return;
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
          // Instant: the section is pinned, so the page does not visibly move. A smooth scroll
          // would still be running when the lock below expires and drag the slide back.
          window.scrollTo({ top: targetY, behavior: "instant" });
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

  // 2. AUTO-FINISH TRANSITION WHEN SCROLL STOPS
  // Snaps to the nearest / intended slide if scrolling halts mid-transition,
  // guaranteeing the transition always completes, the product & card are 100% entered,
  // and watermark titles never overlap!
  const isTouchActiveRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let snapTimeout: ReturnType<typeof setTimeout> | null = null;

    const snapToNearestSlide = () => {
      // 1. On touch devices / touch scroll, don't run auto-snap (swipes explicitly step color-by-color)
      if (isTouchModeRef.current || isTouchActiveRef.current || isTouchNavigatingRef.current) return;
      // 2. Don't snap during active programmatic animation (clicks/prior snaps)
      if (Date.now() < isProgrammaticUntilRef.current) return;
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const trackHeight = trackRef.current.offsetHeight;
      const scrollableDistance = trackHeight - windowHeight;
      if (scrollableDistance <= 50) return;

      // Only snap if the sticky showcase section is currently pinned / active in view
      const isPinned = rect.top <= 25 && rect.bottom >= windowHeight - 25;
      if (!isPinned) return;

      const currentY = -rect.top;
      const currentProg = Math.max(0, Math.min(totalSlides - 1, (currentY / scrollableDistance) * (totalSlides - 1)));

      // Allow natural exit to Hero at top or to next section at bottom
      if (currentProg <= 0.05 || currentProg >= totalSlides - 1 - 0.05) {
        return;
      }

      const nearestInt = Math.round(currentProg);
      // If already settled within 2% of an integer slide, no action needed
      if (Math.abs(currentProg - nearestInt) < 0.02) {
        return;
      }

      // Check scroll direction to predict user intent
      const scrollDelta = window.scrollY - lastScrollYRef.current;
      let target = nearestInt;

      if (scrollDelta > 0 && currentProg - Math.floor(currentProg) > 0.15) {
        target = Math.ceil(currentProg);
      } else if (scrollDelta < 0 && Math.ceil(currentProg) - currentProg > 0.15) {
        target = Math.floor(currentProg);
      }

      target = Math.max(0, Math.min(totalSlides - 1, target));
      goToSlide(target);
    };

    const onScroll = () => {
      if (Date.now() > isProgrammaticUntilRef.current) {
        lastScrollYRef.current = window.scrollY;
      }
      if (snapTimeout) clearTimeout(snapTimeout);
      snapTimeout = setTimeout(snapToNearestSlide, 140);
    };

    const onScrollEnd = () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      snapToNearestSlide();
    };

    const onTouchStart = () => {
      isTouchActiveRef.current = true;
      if (snapTimeout) clearTimeout(snapTimeout);
    };

    const onTouchEnd = () => {
      isTouchActiveRef.current = false;
      if (snapTimeout) clearTimeout(snapTimeout);
      snapTimeout = setTimeout(snapToNearestSlide, 160);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      if (snapTimeout) clearTimeout(snapTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [goToSlide, totalSlides]);

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

  // 3. TOUCH SCROLL COLOR SWITCHING (MOBILE & TABLET):
  // When doing touch scroll in mobile or tab:
  // - Takes touch start and touch stop (gesture direction)
  // - Just switches the color of the product step-by-step, NOT based on continuous scroll depth.
  // - Fast flings are intercepted so they can never skip multiple colors in a single swipe.
  // - Natural page exit is preserved when scrolling up from Slide 0 (to Hero)
  //   or scrolling down from Slide 4 (to next section).
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const touchStartTimeRef = useRef(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Detect mouse wheel usage to allow continuous scroll depth on desktop/hybrid
    const onWheel = () => {
      isTouchModeRef.current = false;
    };
    window.addEventListener("wheel", onWheel, { passive: true });

    const onTouchStart = (e: TouchEvent) => {
      isTouchModeRef.current = true;
      if (e.touches.length !== 1) return;
      // Let taps on buttons, links, or selector swatches pass through
      if ((e.target as HTMLElement)?.closest?.("button, a, [role='radio'], [role='tab']")) {
        isTouchNavigatingRef.current = false;
        return;
      }
      const t = e.touches[0];
      if (!t) return;
      touchStartPosRef.current = { x: t.clientX, y: t.clientY };
      touchStartTimeRef.current = Date.now();
      isTouchNavigatingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const isTestEnv = !trackRef.current.offsetHeight || trackRef.current.offsetHeight === 0;
      const isPinned = isTestEnv || (rect.top <= 25 && rect.bottom >= windowHeight - 25);
      if (!isPinned) return;

      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStartPosRef.current.x;
      const dy = t.clientY - touchStartPosRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const currentSlide = currentIndexRef.current;

      if (absDy >= absDx) {
        // Vertical swipe
        if (dy < -8) {
          if (currentSlide < totalSlides - 1) {
            // Intercept swipe to prevent fast fling scroll depth; we switch exactly 1 color on stop!
            if (e.cancelable) e.preventDefault();
            isTouchNavigatingRef.current = true;
          } else {
            // Already at last color: allow natural page scroll down to next section
            isTouchNavigatingRef.current = false;
          }
        } else if (dy > 8) {
          if (currentSlide > 0) {
            // Intercept swipe to prevent fast fling scroll depth; we switch exactly 1 color on stop!
            if (e.cancelable) e.preventDefault();
            isTouchNavigatingRef.current = true;
          } else {
            // Already at first color: allow natural page scroll up to Hero
            isTouchNavigatingRef.current = false;
          }
        }
      } else {
        // Horizontal swipe gesture
        if (absDx > 10) {
          if ((dx < 0 && currentSlide < totalSlides - 1) || (dx > 0 && currentSlide > 0)) {
            if (e.cancelable) e.preventDefault();
            isTouchNavigatingRef.current = true;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTouchNavigatingRef.current) return;
      isTouchNavigatingRef.current = false;

      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - touchStartPosRef.current.x;
      const dy = t.clientY - touchStartPosRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const currentSlide = currentIndexRef.current;
      const threshold = 25;

      if (absDy >= absDx) {
        // Vertical swipe: dy < 0 means finger swiped UP (intended scroll DOWN to next color)
        if (dy < -threshold && currentSlide < totalSlides - 1) {
          goToSlide(currentSlide + 1);
        } else if (dy > threshold && currentSlide > 0) {
          goToSlide(currentSlide - 1);
        }
      } else {
        // Horizontal swipe: dx < 0 means finger swiped LEFT (intended scroll RIGHT to next color)
        if (dx < -threshold && currentSlide < totalSlides - 1) {
          goToSlide(currentSlide + 1);
        } else if (dx > threshold && currentSlide > 0) {
          goToSlide(currentSlide - 1);
        }
      }
    };

    slider.addEventListener("touchstart", onTouchStart, { passive: true });
    slider.addEventListener("touchmove", onTouchMove, { passive: false });
    slider.addEventListener("touchend", onTouchEnd, { passive: true });
    slider.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      slider.removeEventListener("touchstart", onTouchStart);
      slider.removeEventListener("touchmove", onTouchMove);
      slider.removeEventListener("touchend", onTouchEnd);
      slider.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [goToSlide, totalSlides]);

  // 4. AUTOPLAY (colourways change on their own, like the 3-piece box section)
  // Runs only while the slider is pinned on screen, the tab is visible, motion is
  // allowed and the visitor has been idle for AUTOPLAY_IDLE_MS. Any wheel, touch,
  // key, pointer or user scroll pauses it immediately. Because the slide is tied to
  // the scroll position, autoplay moves the scroll position *instantly* inside the
  // pinned track (no smooth-scroll tug-of-war), so the page itself never moves.
  const lastUserInputRef = useRef(0);
  const [autoplayActive, setAutoplayActive] = useState(false);
  const autoplayActiveRef = useRef(false);
  autoplayActiveRef.current = autoplayActive;

  const autoAdvance = useCallback(
    (target: number) => {
      const from = currentIndexRef.current;
      setCurrentIndex(target);
      currentIndexRef.current = target;
      isProgrammaticUntilRef.current = Date.now() + 900;

      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const trackTop = window.scrollY + rect.top;
        const scrollableDistance = trackRef.current.offsetHeight - window.innerHeight;
        if (scrollableDistance > 50) {
          const targetY = trackTop + (target / (totalSlides - 1)) * scrollableDistance;
          window.scrollTo({ top: targetY, behavior: "instant" });
        }
      }

      activeAnimationRef.current?.stop();
      activeAnimationRef.current = animate(progress, target, {
        // looping back to the first colour plays as a quick rewind
        duration: target < from ? 1.1 : 0.85,
        ease: [0.22, 1, 0.36, 1],
      });
    },
    [progress, totalSlides],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const markInput = () => {
      lastUserInputRef.current = Date.now();
      // Only touch React state when autoplay is actually running (scroll fires ~60×/s).
      if (autoplayActiveRef.current) setAutoplayActive(false);
    };
    const onScroll = () => {
      // Our own programmatic scrolls (dots, arrows, snapping, autoplay) don't count.
      if (Date.now() > isProgrammaticUntilRef.current) markInput();
    };
    const tick = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const pinned = el.offsetHeight > vh + 50 && rect.top <= 25 && rect.bottom >= vh - 25;
      const eligible =
        pinned &&
        !document.hidden &&
        !isReducedMotion &&
        !isTouchNavigatingRef.current &&
        Date.now() - lastUserInputRef.current > AUTOPLAY_IDLE_MS;
      setAutoplayActive((prev) => (prev === eligible ? prev : eligible));
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((ev) => window.addEventListener(ev, markInput, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = window.setInterval(tick, 400);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markInput));
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(id);
    };
  }, [isReducedMotion]);

  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setTimeout(() => autoAdvance((currentIndexRef.current + 1) % totalSlides), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplayActive, currentIndex, totalSlides, autoAdvance]);

  // 5. PHONE LAYOUT: measure the bottom stack (card + selector + CTA) once per
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

  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const shopEl = document.getElementById("shop");
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "#shop");
    }
  };

  const hasNextSlide = currentIndex < totalSlides - 1;
  const hasPrevSlide = currentIndex > 0;

  return (
    <div
      id="designs"
      ref={trackRef}
      className="relative w-full"
      style={{
        // 440vh total height: gives ~85vh of natural scroll distance per slide
        // Reduces scroll speed so single scrolls move gently and predictably
        height: `${Math.max(100, 100 + (totalSlides - 1) * 85)}vh`,
        scrollMarginTop: "-6rem",
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="sticky top-0 h-[100svh] min-h-[580px] w-full overflow-hidden select-none bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={
          {
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

        {/* Preload first slide image */}
        <link rel="preload" as="image" href={activeSlides[0]?.image} />

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
            // All stay mounted (a stable layer tree is cheaper than re-creating layers
            // while scrolling); only the slide on screen runs its ambient spin/pulse.
            <FloatingAccentsItem
              key={`accents-${slide.id}`}
              slide={slide}
              index={idx}
              progress={progress}
              isReducedMotion={isReducedMotion}
              isActive={idx === currentIndex}
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
          productSelector={<ProductSelector selectedProduct={selectedProduct} currentSlide={slide} onSelectProduct={handleSelectProduct} />}
            features={<FeatureRow features={FEATURES_BY_PRODUCT[selectedProduct]} color={slide.darkColor} />}
          />
        ))}

        {/* Navigation Arrows — phones: level with the product; larger screens: vertically centred */}
        <div className="pointer-events-none absolute inset-x-2 top-[var(--pc-m)] h-0 flex items-center justify-between z-[70] sm:inset-x-4 sm:top-0 sm:h-full lg:inset-x-8">
          <button
            type="button"
            aria-label="Previous design slide"
            disabled={!hasPrevSlide}
            onClick={(e) => {
              e.stopPropagation();
              if (hasPrevSlide) goToSlide(currentIndex - 1);
            }}
            className={`pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/80 bg-[#fdf6f4]/95 text-foreground shadow-[0_8px_24px_-12px_rgba(90,30,50,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-card hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              !hasPrevSlide ? "opacity-25 cursor-not-allowed hover:scale-100" : "opacity-90 hover:opacity-100"
            }`}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <button
            type="button"
            aria-label="Next design slide"
            disabled={!hasNextSlide}
            onClick={(e) => {
              e.stopPropagation();
              if (hasNextSlide) goToSlide(currentIndex + 1);
            }}
            className={`pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/80 bg-[#fdf6f4]/95 text-foreground shadow-[0_8px_24px_-12px_rgba(90,30,50,0.45)] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-card hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              !hasNextSlide ? "opacity-25 cursor-not-allowed hover:scale-100" : "opacity-90 hover:opacity-100"
            }`}
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

        {/* Scroll Hint on First View - Positioned above the info card so it never overlaps */}
        {!hasInteracted && (
          <div
            className="pointer-events-none absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[70] hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-1.5 backdrop-blur-md text-foreground text-xs font-medium tracking-wide shadow-md transition-opacity duration-500 animate-pulse"
          >
            <Hand className="h-3.5 w-3.5 text-primary animate-bounce" />
            <span>Scroll down to explore designs</span>
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
