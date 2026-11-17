import { useEffect, useRef, useState, type ReactNode } from "react";
import { Feather, Leaf, Move, Sparkles } from "lucide-react";
import type { ShowcaseProductType, ShowcaseSlide } from "@/data/showcase-slides";
import podiumArt from "@/assets/showcase/podium/podium-plain.webp";

/**
 * Podium artwork geometry (fractions of the trimmed image, measured from its alpha;
 * regenerate with scratch/generate-podium-plain.mjs): the podium body spans
 * 6.8%–93.2% of the width and its top rim is the top edge of the image; only the
 * soft contact shadow extends beyond the body.
 */
const PODIUM_IMG = {
  w: 1200,
  h: 279,
  bodyLeft: 0.068,
  bodyRight: 0.932,
  bodyCenterX: 0.5,
  rimTop: 0,
};

/**
 * Decorative stage + feature row for the colourway slider (second screen).
 *
 * Purely additive: the stage only *reads* the slider state (current slide,
 * slide list), so the existing scroll / wheel / swipe / keyboard / dots /
 * arrows behaviour is unchanged. Nothing here re-renders while scrolling —
 * it only updates when the current slide or the window size changes.
 */

type Anchor = {
  cx: number;
  cy: number;
  bottom: number;
  size: number;
  secW: number;
  secH: number;
  stackTop: number | null; // top of the phone bottom stack (card + selector + CTA)
  stackRight: number | null; // right edge of the content card (side card on larger screens)
};
type Bounds = { top: number; bottom: number; left: number; right: number }; // 0–1 fractions

/**
 * The product photos carry different amounts of transparent padding. Find the
 * visible (non-transparent) box of each image once — on a tiny 64px canvas —
 * and cache it, so the podium sits under the garment, not under empty pixels.
 */
const boundsCache = new Map<string, Bounds>();
function visibleBounds(img: HTMLImageElement): Bounds {
  const full = { top: 0, bottom: 1, left: 0, right: 1 };
  const key = img.currentSrc || img.src;
  const hit = boundsCache.get(key);
  if (hit) return hit;
  if (!img.complete || !img.naturalWidth) return full;
  try {
    const W = 64;
    const H = Math.max(1, Math.round((W * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return full;
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    let top = H;
    let bottom = -1;
    let left = W;
    let right = -1;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (data[(y * W + x) * 4 + 3]! > 24) {
          if (y < top) top = y;
          if (y > bottom) bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
    const b =
      bottom < 0
        ? full
        : { top: top / H, bottom: (bottom + 1) / H, left: left / W, right: (right + 1) / W };
    boundsCache.set(key, b);
    return b;
  } catch {
    return full; // e.g. a cross-origin image: fall back to the element box
  }
}

/**
 * Measures where the current product image actually renders inside the
 * slider section, so the halo, ring, ribbon and podium hug every product,
 * whatever its proportions or the screen size.
 */
function useProductAnchor(
  layerRef: React.RefObject<HTMLDivElement | null>,
  currentIndex: number,
  slides: ShowcaseSlide[],
) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  useEffect(() => {
    const section = layerRef.current?.parentElement;
    if (!section) return;
    let raf = 0;
    const img = section.querySelectorAll<HTMLImageElement>('[aria-roledescription="slide"] img')[
      currentIndex
    ];
    const stack = section.querySelectorAll<HTMLElement>("[data-slide-stack]")[currentIndex];

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!img) return;
        const s = section.getBoundingClientRect();
        // Resting layout box (ignores the img's own enter/exit transform): the
        // parent frame never moves, the offsets are untransformed.
        const pr = (img.offsetParent ?? img.parentElement)?.getBoundingClientRect();
        if (!pr) return;
        const r = {
          left: pr.left + img.offsetLeft,
          top: pr.top + img.offsetTop,
          width: img.offsetWidth,
          height: img.offsetHeight,
        };
        if (!r.width || !r.height) return;
        // object-contain: the drawn picture may be letterboxed inside the element box
        const ratio =
          img.naturalWidth && img.naturalHeight
            ? img.naturalWidth / img.naturalHeight
            : r.width / r.height;
        const drawW = Math.min(r.width, r.height * ratio);
        const drawH = drawW / ratio;
        const x0 = r.left + (r.width - drawW) / 2;
        const y0 = r.top + (r.height - drawH) / 2;
        const v = visibleBounds(img);
        const left = x0 + v.left * drawW;
        const right = x0 + v.right * drawW;
        const top = y0 + v.top * drawH;
        const bottom = y0 + v.bottom * drawH;
        // The stack's own entrance offset (translateY) is ignored by offsetTop.
        const stackTop = stack && stack.offsetHeight ? stack.offsetTop : null;
        const stackRight = stack && stack.offsetWidth ? stack.offsetLeft + stack.offsetWidth : null;
        setAnchor({
          cx: (left + right) / 2 - s.left,
          cy: (top + bottom) / 2 - s.top,
          bottom: bottom - s.top,
          size: Math.max(right - left, bottom - top),
          secW: s.width,
          secH: s.height,
          stackTop,
          stackRight,
        });
      });
    };

    measure();
    img?.addEventListener("load", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    if (img) ro.observe(img);
    if (stack) ro.observe(stack);
    return () => {
      cancelAnimationFrame(raf);
      img?.removeEventListener("load", measure);
      ro.disconnect();
    };
  }, [layerRef, currentIndex, slides]);

  return anchor;
}

/* ── Inline art (colour comes from `currentColor`, so it can transition cheaply) ── */

function SilkRibbon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden
    >
      <defs>
        <linearGradient id="rb-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.18" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rb-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.3" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="0.85" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rb-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="0.78" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* main twisting band */}
      <path
        d="M0 270 C200 130 360 70 540 175 C720 280 880 330 1200 120 L1200 168 C900 360 720 330 540 228 C370 130 220 170 0 312 Z"
        fill="url(#rb-a)"
      />
      <path
        d="M0 270 C200 130 360 70 540 175 C720 280 880 330 1200 120"
        fill="none"
        stroke="url(#rb-h)"
        strokeWidth="2"
      />
      {/* softer echo band */}
      <path
        d="M60 330 C260 210 420 170 600 250 C780 330 960 300 1180 210 L1180 236 C960 330 780 360 600 282 C430 205 280 250 60 352 Z"
        fill="url(#rb-b)"
      />
    </svg>
  );
}

/* ── Stage: halo, glow ring, silk ribbon and podium (behind title & product) ── */

export function ShowcaseStage({
  slides,
  currentIndex,
}: {
  slides: ShowcaseSlide[];
  currentIndex: number;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const a = useProductAnchor(layerRef, currentIndex, slides);
  const slide = slides[currentIndex] ?? slides[0];

  const mobile = (a?.secW ?? 1024) < 640;
  const tablet = !mobile && (a?.secW ?? 1024) < 1024;
  const halo = a ? Math.min(a.size * 2.3, Math.max(a.secW, a.secH) * 0.95) : 0;
  const ring = a ? a.size * 1.42 : 0;
  const ribbonW = a ? Math.min(a.secW * (mobile ? 1.25 : 1.05), 1500) : 0;
  const ribbonH = ribbonW / 3.2;

  // Podium: wider than the product, but it must end above the controls/dots.
  const reserveBottom = a
    ? mobile && a.stackTop !== null
      ? a.secH - a.stackTop + 6
      : mobile
        ? 285
        : tablet
          ? 205
          : 66
    : 0;
  const desktop = !mobile && !tablet;
  const podiumW = a
    ? Math.min(
        a.size * (desktop ? 1.55 : 1.45),
        a.secW * (mobile ? 0.82 : desktop ? 0.5 : 0.42),
        desktop ? 660 : 600,
        // never under the side content card
        desktop && a.stackRight !== null ? Math.max(0, (a.cx - a.stackRight - 8) * 2) : Infinity,
        Math.max(0, (a.secH - reserveBottom - a.bottom - 14) * 4),
      )
    : 0;
  const showPodium = podiumW >= 150;
  const podiumImgW = podiumW / (PODIUM_IMG.bodyRight - PODIUM_IMG.bodyLeft);
  // Product bottom floats just above the back of the podium top surface.
  const podiumTop = a
    ? a.bottom + 12 - podiumImgW * (PODIUM_IMG.h / PODIUM_IMG.w) * (PODIUM_IMG.rimTop + 0.05)
    : 0;

  // transform + opacity only: both run on the compositor. (Animating width/height
  // forces layout on every frame.)
  const glide = "transform 600ms cubic-bezier(0.22,1,0.36,1), opacity 500ms ease";

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
    >
      {a && (
        <>
          {/* Halo in the colour of the current shade — static layers, cross-faded */}
          {slides.map((s, i) => (
            <div
              key={s.id}
              className="absolute left-0 top-0 rounded-full"
              style={{
                width: halo,
                height: halo,
                transform: `translate(${a.cx - halo / 2}px, ${a.cy - halo / 2}px)`,
                transition: glide,
                opacity: i === currentIndex ? 1 : 0,
                background: `radial-gradient(closest-side, ${s.swatchBg ?? s.braColor}55 0%, ${s.swatchBg ?? s.braColor}22 45%, transparent 100%)`,
              }}
            />
          ))}

          {/* Translucent silk ribbon sweeping behind the product */}
          <SilkRibbon
            className="absolute left-0 top-0"
            style={{
              width: ribbonW,
              height: ribbonH,
              transform: `translate(${a.cx - ribbonW / 2}px, ${a.cy - ribbonH * 0.55}px)`,
              transition: glide,
              color: slide
                ? `color-mix(in oklab, ${slide.braColor} 75%, ${slide.darkColor})`
                : undefined,
            }}
          />

          {/* Glowing ring around the product (fades out towards the podium) */}
          <div
            className="absolute left-0 top-0 rounded-full"
            style={{
              width: ring,
              height: ring,
              transform: `translate(${a.cx - ring / 2}px, ${a.cy - ring / 2}px)`,
              transition: glide,
              border: "2px solid rgba(255,255,255,0.95)",
              boxShadow:
                "0 0 28px 6px rgba(255,255,255,0.6), inset 0 0 60px rgba(255,255,255,0.45)",
              background:
                "radial-gradient(closest-side, rgba(255,255,255,0.35), rgba(255,255,255,0) 75%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 55%, transparent 88%)",
              maskImage: "linear-gradient(to bottom, #000 0%, #000 55%, transparent 88%)",
            }}
          />

          {/* Plain stone podium (your artwork), right under the product.
              The image is a little wider than the podium body (contact shadow), so it is
              placed from the body's measured position inside the image. */}
          <img
            src={podiumArt}
            alt=""
            width={PODIUM_IMG.w}
            height={PODIUM_IMG.h}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute left-0 top-0 max-w-none select-none"
            style={{
              width: podiumImgW,
              height: podiumImgW * (PODIUM_IMG.h / PODIUM_IMG.w),
              transform: `translate(${a.cx - podiumImgW * PODIUM_IMG.bodyCenterX}px, ${podiumTop}px)`,
              transition: glide,
              opacity: showPodium ? 1 : 0,
            }}
          />
        </>
      )}
    </div>
  );
}

/* ── Feature row shown inside the product card ── */

function BreathableIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {[6, 12, 18].map((x) => (
        <g key={x}>
          <path d={`M${x} 21c-1.2-1.6 1.2-3.2 0-4.8s1.2-3.2 0-4.8 1.2-3.2 0-4.8`} />
          <path d={`M${x - 2} 6.6 ${x} 3.5l2 3.1`} />
        </g>
      ))}
    </svg>
  );
}

function LiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 4v5M18 4v5" />
      <path d="M2.5 15c0-3.5 1.6-6 3.5-6 2.4 0 4.2 2.6 6 5.2 1.8-2.6 3.6-5.2 6-5.2 1.9 0 3.5 2.5 3.5 6" />
      <path d="M2.5 15c1.2 2 3.2 3 5 3 1.8 0 3.4-1.4 4.5-3.8 1.1 2.4 2.7 3.8 4.5 3.8 1.8 0 3.8-1 5-3" />
    </svg>
  );
}

function WaistbandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="4.5" rx="1.2" />
      <path d="M5 9.5v6.5c0 1.5 1.2 3 3 3h1.5L12 15l2.5 4H16c1.8 0 3-1.5 3-3V9.5" />
    </svg>
  );
}

type Feature = { icon: (p: { className?: string }) => ReactNode; label: [string, string] };

const icon = {
  feather: (p: { className?: string }) => <Feather strokeWidth={1.5} {...p} />,
  leaf: (p: { className?: string }) => <Leaf strokeWidth={1.5} {...p} />,
  stretch: (p: { className?: string }) => <Move strokeWidth={1.5} {...p} />,
  smooth: (p: { className?: string }) => <Sparkles strokeWidth={1.5} {...p} />,
  breathable: BreathableIcon,
  lift: LiftIcon,
  waistband: WaistbandIcon,
};

export const FEATURES_BY_PRODUCT: Record<ShowcaseProductType, Feature[]> = {
  bra: [
    { icon: icon.feather, label: ["Lightweight", "Feel"] },
    { icon: icon.breathable, label: ["Breathable", "Fabric"] },
    { icon: icon.lift, label: ["Natural", "Lift"] },
    { icon: icon.leaf, label: ["All-Day", "Comfort"] },
  ],
  boxer: [
    { icon: icon.feather, label: ["Featherweight", "Feel"] },
    { icon: icon.breathable, label: ["Breathable", "Fabric"] },
    { icon: icon.stretch, label: ["4-Way", "Stretch"] },
    { icon: icon.leaf, label: ["All-Day", "Comfort"] },
  ],
  panty: [
    { icon: icon.feather, label: ["Second-Skin", "Feel"] },
    { icon: icon.breathable, label: ["Breathable", "Fabric"] },
    { icon: icon.smooth, label: ["Smooth", "Fit"] },
    { icon: icon.leaf, label: ["All-Day", "Comfort"] },
  ],
  brief: [
    { icon: icon.feather, label: ["Soft", "Touch"] },
    { icon: icon.breathable, label: ["Breathable", "Fabric"] },
    { icon: icon.waistband, label: ["Comfort", "Waistband"] },
    { icon: icon.leaf, label: ["All-Day", "Comfort"] },
  ],
};

export function FeatureRow({
  features,
  color,
  className = "",
}: {
  features: Feature[];
  color: string;
  className?: string;
}) {
  return (
    <ul className={`flex ${className}`}>
      {features.map(({ icon: Icon, label }, i) => (
        <li
          key={label.join(" ")}
          className={`flex min-w-fit flex-1 flex-col items-center gap-1 px-1 text-center text-[10.5px] font-medium leading-tight text-[#2f1e20] sm:text-[11px] ${
            i < features.length - 1 ? "border-r border-[#2a1216]/10" : ""
          }`}
        >
          <span style={{ color }}>
            <Icon className="h-6 w-6" />
          </span>
          <span>
            {label[0]}
            <br />
            {label[1]}
          </span>
        </li>
      ))}
    </ul>
  );
}
