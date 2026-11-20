import { useEffect, useId, useRef } from "react";
// 640×616 copies of the 1024×985 masters (drawn ≤ 310 CSS px); see scratch/generate-responsive-variants.mjs.
import logoRingOnly from "@/assets/logo-ring-only-640.webp";
import logoStyleOnly from "@/assets/logo-style-only-640.webp";
import { BrandWordmark } from "@/components/brand/brand-logo";

interface IntroLoaderProps {
  onComplete?: () => void;
}

/** Whole sequence, ms — the overlay is removed once this has elapsed. */
const TOTAL_MS = 2050;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

/*
 * The sequence runs on CSS keyframes, so it starts with the first paint of the
 * server-rendered HTML instead of waiting for the JavaScript to download and hydrate
 * (until then the screen used to stay blank). Timings match the original phases.
 */
const CSS = `
.ri-overlay{animation:ri-fade-out .35s ${EASE_OUT} 1.7s both}
.ri-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ri-draw .88s cubic-bezier(0.25,1,0.5,1) both}
.ri-ring{animation:ri-show .5s step-end both}
.ri-style{animation:ri-rise .55s ${EASE_OUT} .5s both}
.ri-name{animation:ri-rise .52s ${EASE_OUT} .85s both}
@keyframes ri-draw{to{stroke-dashoffset:0}}
@keyframes ri-show{from{opacity:0}to{opacity:1}}
@keyframes ri-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes ri-fade-out{from{opacity:1}to{opacity:0;pointer-events:none}}
@media (prefers-reduced-motion: reduce){
  .ri-overlay,.ri-draw,.ri-ring,.ri-style,.ri-name{animation:none}
  .ri-draw{stroke-dashoffset:0}
}
`;

/**
 * Premium circular logo reveal animation for RIDOZ fashion e-commerce.
 *
 * Sequence:
 * Phase 1 (0.00s - 0.88s): Authentic burgundy circular ring progressively reveals via smooth circular SVG mask.
 * Phase 2 (0.50s - 1.05s): Original "Style" script typography reveals with subtle opacity fade & gentle upward drift.
 * Phase 3 (0.85s - 1.37s): Bold, prominent "RIDOZ" brand lettering reveals centered directly beneath.
 * Phase 4 (1.70s - 2.05s): Seamless website transition with smooth opacity fade out.
 */
export function IntroLoader({ onComplete }: IntroLoaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);
  done.current = onComplete;
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `ridoz-ring-reveal-${reactId}`;

  useEffect(() => {
    const finish = () => done.current?.();
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("no_intro") === "1" || params.get("skip") === "1") {
        finish();
        return;
      }
    } catch {
      // In case URLSearchParams is restricted
    }

    // Accessibility: reduced-motion users get the static logo briefly, then the site.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(finish, 500);
      return () => clearTimeout(timer);
    }

    // The CSS sequence may have started well before hydration: finish when its fade-out
    // ends (timer fallback for browsers without the Web Animations API).
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fadeOut = overlayRef.current?.getAnimations?.()[0];
    if (fadeOut) {
      fadeOut.finished.then(
        () => !cancelled && finish(),
        () => {},
      );
    } else {
      timer = setTimeout(finish, TOTAL_MS);
    }

    // Allow escape key to immediately skip intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="ri-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fbf1ee] px-6 select-none overflow-hidden"
      style={{ willChange: "opacity" }}
      aria-label="RIDOZ Style Loading"
      role="status"
    >
      <style>{CSS}</style>
      {/* Subtle warm luxury grain overlay */}
      <div className="grain absolute inset-0 -z-10 opacity-40 pointer-events-none" />

      {/* Central Logo Container */}
      <div className="relative flex flex-col items-center justify-center">
        {/*
          Circular Ring + Script Typography
          Enlarged on every device (phones ~62% of the viewport width), capped at 310px on desktop
        */}
        <div className="relative w-[min(62vw,240px)] sm:w-[260px] md:w-[290px] lg:w-[310px] aspect-[1024/985]">
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
                <path
                  className="ri-draw"
                  d="M 330 860 A 382 382 0 1 1 692 860"
                  fill="none"
                  stroke="white"
                  strokeWidth={240}
                  strokeLinecap="butt"
                  pathLength={1}
                />
              </mask>
            </defs>

            {/* Original Ring graphic revealed via progressive mask */}
            <image href={logoRingOnly} width="1024" height="985" mask={`url(#${maskId})`} />
          </svg>

          {/*
            From phase 2 on, the unmasked image sits on top so the ring is 100.0% crisp,
            identical to the original artwork across all display engines.
          */}
          <img
            src={logoRingOnly}
            alt=""
            draggable={false}
            className="ri-ring absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
          />

          {/*
            Original "Style" Script Typography:
            Isolated calligraphy asset containing only the script lettering.
            Reveals in its exact original position within the bottom opening.
          */}
          <img
            src={logoStyleOnly}
            alt="Style"
            draggable={false}
            className="ri-style absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
          />
        </div>

        {/*
          Phase 3: Official "RIDOZ" wordmark centered directly below
        */}
        <div className="ri-name mt-5 sm:mt-6 md:mt-7 flex flex-col items-center">
          {/* Sized to balance the ring above (~60% of its width) */}
          <BrandWordmark
            priority
            decorative
            sizes="(min-width: 1024px) 194px, 166px"
            className="h-12 lg:h-14"
          />
        </div>
      </div>
    </div>
  );
}
