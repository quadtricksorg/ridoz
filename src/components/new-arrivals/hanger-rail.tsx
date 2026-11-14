import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  RAIL_CATEGORIES as CATEGORIES,
  RAIL_PRODUCTS as PRODUCTS,
  SIZES,
  type Product,
  type RailCategory,
} from "@/data/products";
import { useRailGoto } from "@/lib/shop-links";
import { FEATURES_BY_PRODUCT, FeatureRow } from "@/components/showcase/showcase-stage-decor";

/**
 * Shop by collection — a boutique clothes rail of the collections.
 *
 * Every product hangs side-on from a brass rail that loops (the last garments hang to
 * the left of the first one, so neither side is ever empty). The selected garment is
 * always centred and turns to face the viewer with breathing room on both sides; the
 * rail advances every ~1s. Hover (with a short intent delay) or click any garment to
 * bring it to the centre; swipe / drag / horizontal-scroll, arrows, keys and the
 * category chips all work, and the chips and the rail stay in sync both ways.
 *
 * Garments are drawn at their real-life relative size (a trunk is ~36 cm wide, a
 * panty ~30 cm), so the rail looks natural.
 *
 * Motion (compositor-only: transform + opacity): each hanger's x is a spring whose
 * velocity drives a pendulum sway; side view = rotateY(±80°), front view = 0.
 */

const DWELL_MS = 1000; // front view held for 1s …
const TURN_MS = 650; // … plus the turn / slide transition
const STEP_MS = DWELL_MS + TURN_MS;
const RESUME_MS = 4500; // idle time after manual input before autoplay resumes
const GOTO_HOLD_MS = 9000; // a garment opened from another section stays in front this long
const HOVER_INTENT_MS = 90; // pointer must rest on a garment this long to preview it
const HOVER_RELEASE_MS = 220; // grace period before a preview ends (no flicker at edges)
const SIDE_ANGLE = 80;
const N = PRODUCTS.length;
const HALF = Math.floor(N / 2);

/** Real-life width of each garment type (cm, laid flat / hung). */
const WIDTH_CM: Record<RailCategory, number> = {
  bra: 34,
  panty: 30,
  print: 30,
  brief: 32,
  trunk: 36,
};
const TAGLINE: Record<RailCategory, string> = {
  bra: "Wire-free contour cups in breathable fabric.",
  panty: "Mid-rise hipster with a soft, no-dig waistband.",
  print: "Playful prints on second-skin stretch fabric.",
  brief: "Classic brief with a branded comfort waistband.",
  trunk: "Snug boxer trunk with 4-way stretch.",
};
const FEATURES = {
  bra: FEATURES_BY_PRODUCT.bra,
  panty: FEATURES_BY_PRODUCT.panty,
  print: FEATURES_BY_PRODUCT.panty,
  brief: FEATURES_BY_PRODUCT.brief,
  trunk: FEATURES_BY_PRODUCT.boxer,
} satisfies Record<RailCategory, unknown>;
const realSize = (p: Product & { category: RailCategory }) => {
  const w = WIDTH_CM[p.category];
  return { w, h: (w * p.h) / p.w };
};
const REAL = PRODUCTS.map(realSize);
const MAX_W_CM = Math.max(...REAL.map((s) => s.w));
const MAX_H_CM = Math.max(...REAL.map((s) => s.h));
const MIN_W_CM = Math.min(...REAL.map((s) => s.w));

const firstIndexOf = (c: RailCategory) => PRODUCTS.findIndex((p) => p.category === c);
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<
  RailCategory,
  string
>;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mod = (v: number) => ((v % N) + N) % N;
/** Signed distance on the loop, in [-HALF, N - HALF). */
const loopDist = (i: number, active: number) => mod(i - active + HALF) - HALF;

type Geo = {
  W: number;
  H: number;
  railY: number;
  hangerH: number; // hook + bar + clips
  slot: number; // spacing between side-view garments
  gapBase: number;
  offLimit: number; // |x| beyond this a garment is off-screen
  sizes: { w: number; h: number }[]; // drawn size of every garment (px)
  focus: number; // extra scale of the selected garment (bigger on desktop)
};

function computeGeo(W: number, H: number): Geo {
  const hangerH = clamp(H * 0.1, 30, 56);
  const floor = clamp(H * 0.06, 14, 36);
  const phone = W < 640;
  const share = phone ? 0.74 : W / H < 1.05 ? 0.6 : 0.3; // widest garment vs stage width
  const fill = phone ? 1 : 0.78; // share of the free height the tallest garment may use
  const ppc = Math.min(((H - 10 - hangerH - floor) * fill) / MAX_H_CM, (W * share) / MAX_W_CM); // px per cm
  const sizes = REAL.map((s) => ({ w: s.w * ppc, h: s.h * ppc }));
  const focus = phone ? 1 : W / H < 1.05 ? 1.08 : 1.2;
  const tallest = (hangerH + MAX_H_CM * ppc) * focus;
  const railY = clamp((H - floor - tallest) / 2, 8, H * 0.22);

  // Side garments are packed tightly, but the loop must always reach past both edges
  // so items wrapping round the back are never seen jumping.
  const maxW = MAX_W_CM * ppc;
  const margin = maxW * 0.16 + 12;
  let slot = clamp(W * 0.028, 16, 36);
  const gapBase = 6;
  const minExtra = (MIN_W_CM * ppc) / 2 + gapBase - slot / 2;
  slot = Math.max(slot, (W / 2 + margin - minExtra) / (HALF - 1));
  return { W, H, railY, hangerH, slot, gapBase, offLimit: W / 2 + margin, sizes, focus };
}

/** Extra half-space either side of the front garment ("a little space"). */
const extraFor = (g: Geo, active: number) => {
  const w = g.sizes[active]!.w * g.focus;
  return w / 2 + w * 0.06 + g.slot * 0.8 + g.gapBase - g.slot / 2;
};

/* ── Hanger artwork ──────────────────────────────────────────────────────── */

function Hanger({ w, h, kind }: { w: number; h: number; kind: "clip" | "bra" }) {
  const cx = w / 2;
  const barY = h * 0.6;
  const hookR = Math.min(h * 0.17, 10);
  const hook = `M${cx} ${barY} V${hookR * 2.1} C${cx} ${hookR * 0.2} ${cx + hookR * 1.9} ${hookR * 0.2} ${cx + hookR * 1.9} ${hookR * 1.5} C${cx + hookR * 1.9} ${hookR * 2.3} ${cx + hookR * 1.2} ${hookR * 2.6} ${cx + hookR * 0.7} ${hookR * 2.4}`;
  const inset = kind === "bra" ? w * 0.16 : w * 0.05;
  const clipW = Math.max(6, w * 0.035);
  const clips = [inset, w - inset];
  return (
    <svg aria-hidden width={w} height={h} className="absolute left-0 top-0 overflow-visible">
      <path d={hook} fill="none" stroke="url(#hr-brass)" strokeWidth={2.4} strokeLinecap="round" />
      <rect
        x={inset - clipW * 0.9}
        y={barY - 3}
        width={w - 2 * inset + clipW * 1.8}
        height={6}
        rx={3}
        fill="#2b1b20"
      />
      {clips.map((x) => (
        <g key={x}>
          <rect
            x={x - clipW / 2}
            y={barY}
            width={clipW}
            height={h - barY + 4}
            rx={2}
            fill="#3a272d"
          />
          <rect
            x={x - clipW / 2 + 1.5}
            y={barY + 3}
            width={clipW - 3}
            height={2}
            rx={1}
            fill="#c9a96a"
            opacity={0.85}
          />
        </g>
      ))}
    </svg>
  );
}

/* ── One hanging garment ─────────────────────────────────────────────────── */

type ItemProps = {
  product: Product;
  index: number;
  x: number; // target offset from the stage centre
  d: number; // signed loop distance (in items) from the selected garment
  w: number;
  h: number;
  slot: number;
  railY: number;
  hangerH: number;
  offLimit: number;
  idle: boolean; // gentle idle sway on the front garment
  preview: boolean; // hovered: turned to the front in place, full colour, swaying
  focus: number; // scale of the selected garment
  onPick: (i: number) => void;
};

const HangerItem = memo(function HangerItem({
  product,
  index,
  x,
  d,
  w,
  h,
  slot,
  railY,
  hangerH,
  offLimit,
  idle,
  preview,
  focus,
  onPick,
}: ItemProps) {
  const isActive = d === 0;
  const kind = product.category === "bra" ? "bra" : "clip";

  // Position spring → velocity → pendulum sway (garment trails the rail's motion).
  const target = useMotionValue(x);
  const sx = useSpring(target, { stiffness: 140, damping: 24, mass: 0.9 });
  const prevX = useRef(x);
  useEffect(() => {
    // Off-screen before *and* after (incl. wrapping round the loop) → jump, no spring work.
    const lim = offLimit + w * 0.1;
    if (Math.abs(prevX.current) > lim && Math.abs(x) > lim) {
      target.jump(x);
      sx.jump(x);
    } else {
      target.set(x);
    }
    prevX.current = x;
  }, [x, target, sx, offLimit, w]);
  // Off-screen garments drop out of rendering/compositing entirely.
  const visibility = useTransform(sx, (v) =>
    Math.abs(v) > offLimit + w * 0.1 ? "hidden" : "visible",
  );
  const vel = useVelocity(sx);
  const swayTarget = useTransform(vel, (v) => clamp(v * 0.0065, -9, 9));
  const sway = useSpring(swayTarget, { stiffness: 70, damping: 7, mass: 0.7 });

  const garmentTop = hangerH;
  const hookLift = hangerH * 0.14; // hook curls over the rail
  const near = Math.abs(d) <= 6;
  const front = isActive || preview;
  const turn = front ? 0 : d < 0 ? 180 - SIDE_ANGLE : SIDE_ANGLE; // crossing sides passes edge-on

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-0"
      style={{
        x: sx,
        visibility,
        width: w,
        marginLeft: -w / 2,
        top: railY - hookLift,
        zIndex: preview ? 300 : 200 - Math.abs(d) * 2,
      }}
    >
      {/* pendulum around the hook */}
      <motion.div style={{ rotate: sway, transformOrigin: `50% ${hookLift}px` }}>
        <motion.div
          style={{ transformOrigin: `50% ${hookLift}px` }}
          animate={
            preview
              ? { rotate: [0, 2.2, -1.6, 1, 0] }
              : idle && isActive
                ? { rotate: [0, 1.1, 0, -1.1, 0] }
                : { rotate: 0 }
          }
          transition={
            preview
              ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              : idle && isActive
                ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
          }
        >
          <motion.div
            className="relative"
            style={{
              transformPerspective: 1100,
              transformOrigin: `50% ${hookLift}px`,
              height: garmentTop + h,
            }}
            initial={false}
            // Selected garment: full colour and (on desktop) larger; the rest step back.
            animate={{
              rotateY: turn,
              scale: isActive ? focus : preview ? 1 : 0.93,
              opacity: front ? 1 : 0.5,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 19, mass: 0.9 }}
          >
            <img
              src={product.image}
              alt=""
              width={product.w}
              height={product.h}
              draggable={false}
              decoding="async"
              loading={near ? "eager" : "lazy"}
              className="pointer-events-none absolute left-0 max-w-none select-none"
              style={{ top: garmentTop, width: w, height: h }}
            />
            <Hanger w={w} h={hangerH} kind={kind} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Hit area (not rotated): the front garment's full width, one slot for side garments */}
      <button
        type="button"
        tabIndex={-1}
        data-rail-index={index}
        aria-label={`Show ${product.name}`}
        onClick={() => onPick(index)}
        className="pointer-events-auto absolute top-0 cursor-pointer bg-transparent"
        style={{
          left: isActive ? (w - w * focus) / 2 : preview ? 0 : w / 2 - slot / 2,
          width: isActive ? w * focus : preview ? w : slot,
          height: (hangerH + h) * (isActive ? focus : 1),
        }}
      />
    </motion.div>
  );
});

/* ── Category chip with a real product photo ─────────────────────────────── */

const CategoryChip = memo(function CategoryChip({
  id,
  label,
  product,
  on,
  onSelect,
}: {
  id: RailCategory;
  label: string;
  product: Product;
  on: boolean;
  onSelect: (c: RailCategory) => void;
}) {
  const light = product.hex === "#f2f2f2";
  return (
    <button
      type="button"
      role="tab"
      data-cat={id}
      aria-selected={on}
      onClick={() => onSelect(id)}
      className={`group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-semibold transition-colors duration-200 sm:pr-4 [@media(max-height:720px)]:py-0.5 ${
        on ? "border-transparent" : "border-border bg-background/70 hover:border-primary"
      }`}
    >
      {on && (
        <motion.span
          layoutId="rail-cat-pill"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="absolute inset-0 rounded-full bg-primary"
        />
      )}
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-black/5 sm:h-10 sm:w-10 lg:h-11 lg:w-11 [@media(max-height:720px)]:h-8 [@media(max-height:720px)]:w-8"
        style={{
          backgroundColor: light ? "#e6dcd9" : `color-mix(in oklab, ${product.hex} 30%, #fff)`,
          transition: "background-color 400ms ease",
        }}
      >
        <img
          src={product.image}
          alt=""
          width={product.w}
          height={product.h}
          decoding="async"
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain p-[3px] transition-transform duration-300 group-hover:scale-110"
        />
      </span>
      <span className={`relative whitespace-nowrap ${on ? "text-primary-foreground" : ""}`}>
        {label}
      </span>
    </button>
  );
});

/* ── Section ─────────────────────────────────────────────────────────────── */

export function NewArrivals() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(sectionRef, { amount: 0.35 });

  const [geo, setGeo] = useState<Geo | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;
  const [hovering, setHovering] = useState(false);
  const [preview, setPreview] = useState(-1); // garment previewed in place under the mouse
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false); // announce changes only for user-driven moves
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Measure the stage */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (typeof ResizeObserver === "undefined") {
      setGeo(computeGeo(el.clientWidth || 1024, el.clientHeight || 600));
      return;
    }
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e!.contentRect;
      if (width > 0 && height > 0) setGeo(computeGeo(width, height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pause = useCallback((ms: number = RESUME_MS) => {
    setPaused(true);
    setManual(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setPaused(false);
      setManual(false);
    }, ms);
  }, []);

  /** Select a garment; it always moves to the centre of the stage. */
  const select = useCallback((i: number) => {
    setActive(mod(i));
    setPreview(-1);
  }, []);
  const pick = useCallback(
    (i: number) => {
      select(i);
      pause();
    },
    [select, pause],
  );

  /* Autoplay */
  const playing = inView && !reduce && !hovering && !paused && !!geo;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => select(active + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, active, select]);

  /* "Shop this look" / "Explore" / "Shop boxers" elsewhere on the page (src/lib/shop-links.ts):
     show that garment, held long enough for the page to scroll here and the viewer to look. */
  useRailGoto((i) => {
    select(i);
    pause(GOTO_HOLD_MS);
  });

  const step = useCallback((dir: number) => pick(activeRef.current + dir), [pick]);

  /* Horizontal wheel / trackpad scrolling moves the rail */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      acc += dx;
      const unit = 42;
      if (Math.abs(acc) >= unit) {
        const n = Math.trunc(acc / unit);
        acc -= n * unit;
        pick(activeRef.current + n);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pick]);

  /* Hover preview: the garment the (moving) mouse rests on turns to the front where it
     hangs, with room either side — a click brings it to the centre. Only real pointer
     movement counts, so a garment sliding under a still cursor is never previewed. */
  const hoverIntent = useRef<{
    idx: number;
    x: number;
    y: number;
    t?: ReturnType<typeof setTimeout>;
  }>({ idx: -1, x: 0, y: 0 });
  const clearHover = () => {
    clearTimeout(hoverIntent.current.t);
    hoverIntent.current.idx = -1;
    setPreview(-1);
  };
  useEffect(
    () => () => {
      clearTimeout(pauseTimer.current);
      clearTimeout(hoverIntent.current.t);
    },
    [],
  );

  /* Drag / swipe the rail (touch keeps native vertical scrolling via touch-action: pan-y) */
  const drag = useRef<{ x: number; y: number; start: number; moved: boolean; id: number } | null>(
    null,
  );
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, start: active, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = drag.current;
    if (g && g.id === e.pointerId) {
      const dx = e.clientX - g.x;
      if (!g.moved && Math.abs(dx) >= 8 && Math.abs(dx) >= Math.abs(e.clientY - g.y)) {
        g.moved = true;
        clearHover();
        stageRef.current?.setPointerCapture(e.pointerId);
      }
      if (g.moved) {
        const n = Math.round(-dx / ((geo?.slot ?? 30) * 1.35));
        const j = mod(g.start + n);
        if (j !== activeRef.current) pick(j);
        return;
      }
    }
    if (e.pointerType !== "mouse") return;
    const h = hoverIntent.current;
    if (Math.abs(e.clientX - h.x) + Math.abs(e.clientY - h.y) < 2) return;
    h.x = e.clientX;
    h.y = e.clientY;
    const hit = (e.target as Element).closest?.("[data-rail-index]");
    const idx = hit ? Number(hit.getAttribute("data-rail-index")) : -1;
    if (idx === h.idx) return;
    clearTimeout(h.t);
    h.idx = idx;
    const next = idx === activeRef.current ? -1 : idx;
    h.t = setTimeout(() => setPreview(next), idx < 0 ? HOVER_RELEASE_MS : HOVER_INTENT_MS);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.moved) {
      // swallow the click that follows a drag
      const stop = (ev: Event) => ev.stopPropagation();
      window.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);
    }
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  /* Category chips ↔ rail sync */
  const current = PRODUCTS[active]!;
  const activeCat = current.category;
  const pickCategory = useCallback((c: RailCategory) => pick(firstIndexOf(c)), [pick]);
  useEffect(() => {
    const box = chipsRef.current;
    const chip = box?.querySelector<HTMLElement>(`[data-cat="${activeCat}"]`);
    if (!box || !chip || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({
      left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [activeCat]);

  /* Screen positions: the selected garment sits at the centre, the rest loop round it */
  const positions = useMemo(() => {
    if (!geo) return [];
    const extra = extraFor(geo, active);
    const base = PRODUCTS.map((_, i) => {
      const d = loopDist(i, active);
      return { d, x: d * geo.slot + Math.sign(d) * extra };
    });
    if (preview < 0 || preview === active) return base;

    // A previewed garment turns to face the front where it hangs, so it needs room:
    // it moves outward a little and the garments beyond it make way. Near the screen
    // edge it stays fully visible and the garments between it and the centre close up.
    const dh = loopDist(preview, active);
    const s = Math.sign(dh);
    const wh = geo.sizes[preview]!.w;
    const room = Math.max(0, wh / 2 + wh * 0.08 + geo.gapBase + 6 - geo.slot / 2);
    const xh = base[preview]!.x;
    const limit = geo.W * 0.44 - wh / 2 - 8; // clear of the 6% edge fade
    const move = Math.max(0, Math.min(room, limit - Math.abs(xh))); // outward move that fits
    const squeeze = room - move; // what the inner garments give up instead
    return base.map(({ d, x }) => {
      if (Math.sign(d) !== s) return { d, x };
      const k = Math.abs(d);
      const kh = Math.abs(dh);
      if (k === kh) return { d, x: x + s * move };
      if (k > kh) return { d, x: x + s * (move + room) };
      return { d, x: x - s * squeeze * (k / kh) };
    });
  }, [geo, active, preview]);

  const catCount = PRODUCTS.filter((p) => p.category === activeCat).length;
  const catPos = active - firstIndexOf(activeCat) + 1;
  const activeSize = geo?.sizes[active];
  const shadowY = geo && activeSize ? geo.railY + (geo.hangerH + activeSize.h) * geo.focus + 6 : 0;

  return (
    <section
      ref={sectionRef}
      id="shop"
      aria-label="Shop by collection"
      className="relative flex h-[100svh] scroll-mt-[-6rem] min-h-[560px] flex-col overflow-hidden pb-3 pt-[5.2rem] sm:pb-4 sm:pt-[5.6rem] wide:pb-6 wide:pt-[6.4rem]"
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id="hr-brass" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f1dca8" />
            <stop offset="0.5" stopColor="#b98d48" />
            <stop offset="1" stopColor="#7d5a26" />
          </linearGradient>
        </defs>
      </svg>

      {/* Heading + category chips */}
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-col gap-2.5 px-5 sm:gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary sm:text-xs">
            The Collections
          </p>
          <h2 className="mt-1.5 whitespace-nowrap font-display text-[2rem] font-bold leading-none sm:mt-2 sm:text-5xl lg:text-6xl [@media(max-height:720px)]:text-[2rem] [@media(max-height:720px)]:sm:text-4xl">
            Shop by <span className="font-semibold italic text-primary">collection</span>
          </h2>
        </div>
        <div
          ref={chipsRef}
          role="tablist"
          aria-label="Product categories"
          className="no-scrollbar -mx-5 flex min-w-0 gap-2 overflow-x-auto px-5 py-1 2xl:mx-0 2xl:px-0"
        >
          {CATEGORIES.map((c) => {
            const on = c.id === activeCat;
            return (
              <CategoryChip
                key={c.id}
                id={c.id}
                label={c.label}
                product={on ? current : PRODUCTS[firstIndexOf(c.id)]!}
                on={on}
                onSelect={pickCategory}
              />
            );
          })}
        </div>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Products on the rail — use left and right arrow keys to browse"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            clearHover();
            setHovering(false);
            pause(); // let the viewer look a moment longer before autoplay resumes
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative mt-2 min-h-0 flex-1 select-none overflow-hidden outline-none [touch-action:pan-y] sm:mt-3 wide:mt-5"
        style={
          {
            contain: "layout paint",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
          } as CSSProperties
        }
      >
        {/* Spotlight + tinted glow behind the front garment (static position; colour fades) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[8%] h-[88%] w-[min(90%,720px)] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 46%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 100%)",
          }}
        />
        {/* Tiny 64px glow layer scaled up by the compositor — colour changes repaint 64px, not the stage */}
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[50%] h-0 w-0">
          <motion.div
            className="absolute -left-8 -top-8 h-16 w-16 rounded-full"
            style={{
              scaleX: 7,
              scaleY: 6,
              WebkitMaskImage: "radial-gradient(closest-side, #000 0%, transparent 100%)",
              maskImage: "radial-gradient(closest-side, #000 0%, transparent 100%)",
            }}
            animate={{
              backgroundColor: current.hex,
              opacity: current.hex === "#f2f2f2" ? 0.06 : 0.16,
            }}
            transition={{ duration: 0.8 }}
          />
        </div>
        {/* Floor shadow under the front garment (follows its real height) */}
        {geo && activeSize && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-10 rounded-[50%]"
            style={{
              width: 360,
              marginLeft: -180,
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(60,20,30,0.2) 0%, rgba(60,20,30,0) 100%)",
            }}
            initial={false}
            animate={{
              y: Math.min(shadowY, geo.H - 30),
              scaleX: clamp((activeSize.w * geo.focus) / 300, 0.5, 1.6),
            }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        )}

        {/* Rail */}
        {geo && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ top: geo.railY - 3 }}
          >
            <div
              className="h-[7px] w-full rounded-full shadow-[0_6px_10px_-4px_rgba(70,40,10,0.45)]"
              style={{ background: "linear-gradient(180deg,#f6e6bd 0%,#c9a15c 45%,#8a6430 100%)" }}
            />
          </div>
        )}

        {geo &&
          PRODUCTS.map((p, i) => (
            <HangerItem
              key={p.id}
              product={p}
              index={i}
              x={positions[i]!.x}
              d={positions[i]!.d}
              w={geo.sizes[i]!.w}
              h={geo.sizes[i]!.h}
              slot={geo.slot}
              railY={geo.railY}
              hangerH={geo.hangerH}
              offLimit={geo.offLimit}
              idle={inView && !reduce}
              preview={i === preview}
              focus={geo.focus}
              onPick={pick}
            />
          ))}
      </div>

      {/* Active product card: name, colour, sizes + controls. A card on phones (fills the
          space under the rail); a slim bar between the arrows on larger screens. */}
      <div className="mx-auto mt-2 w-full max-w-6xl shrink-0 px-4 sm:px-5 wide:mt-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2.5 rounded-3xl border border-white/80 bg-[#fdf6f4]/95 px-3 py-3 shadow-[0_14px_36px_-22px_rgba(90,30,50,0.5)] sm:gap-x-3 sm:gap-y-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none [@media(max-height:640px)]:py-2">
          <button
            type="button"
            aria-label="Previous product"
            onClick={() => step(-1)}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background/70 transition-colors hover:border-primary hover:text-primary sm:row-span-2 sm:h-11 sm:w-11"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 text-center" aria-live={manual ? "polite" : "off"} aria-atomic>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <p className="truncate font-display text-lg font-semibold leading-tight sm:text-2xl">
                  {current.name}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs sm:tracking-[0.18em]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: current.hex }}
                  />
                  <span className="truncate">
                    {current.colour} · {CATEGORY_LABEL[activeCat]} {catPos}/{catCount}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground sm:hidden [@media(max-height:700px)]:hidden">
                  {TAGLINE[activeCat]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            aria-label="Next product"
            onClick={() => step(1)}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background/70 transition-colors hover:border-primary hover:text-primary sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:h-11 sm:w-11"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Phones with room to spare: the fabric features, as on the colour slider */}
          <FeatureRow
            features={FEATURES[activeCat]}
            color={current.hex === "#f2f2f2" ? "#6b5a5d" : current.hex}
            className="col-span-3 border-y border-[#2a1216]/8 py-2.5 sm:hidden [@media(max-height:760px)]:hidden"
          />

          {/* Available sizes + the dwell progress */}
          <div className="col-span-3 flex flex-col items-center sm:col-span-1 sm:col-start-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:hidden">
              Available sizes
            </p>
            <ul
              aria-label="Available sizes"
              className="flex flex-wrap items-center justify-center gap-1.5"
            >
              {SIZES.map((sz) => (
                <li
                  key={sz}
                  className="flex h-7 min-w-9 items-center justify-center rounded-full border border-border bg-background/80 px-2 text-[11px] font-semibold tracking-wide text-foreground/80 sm:h-6 sm:min-w-8 sm:text-[10.5px]"
                >
                  {sz}
                </li>
              ))}
            </ul>
            <div className="mt-2 h-[2px] w-24 overflow-hidden rounded-full bg-foreground/10">
              {playing && (
                <motion.span
                  key={`p-${active}`}
                  className="block h-full origin-left rounded-full bg-primary"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
