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

import { CATEGORIES, PRODUCTS, type Product, type ProductCategory } from "@/data/products";

/**
 * New Arrivals — a boutique clothes rail.
 *
 * Every product hangs side-on from a brass rail that loops (the last garments hang to
 * the left of the first one, so neither side is ever empty). The selected garment is
 * always centred and turns to face the viewer with breathing room on both sides; the
 * rail advances every ~1s. Hover (with a short intent delay) or click any garment to
 * bring it to the centre; swipe / drag / horizontal-scroll, arrows, keys and the
 * category chips all work, and the chips and the rail stay in sync both ways.
 *
 * Garments are drawn at their real-life relative size (a vest is ~62 cm tall, a bra
 * ~34 cm wide), so tops look big and innerwear small — as on a real rail.
 *
 * Motion (compositor-only: transform + opacity): each hanger's x is a spring whose
 * velocity drives a pendulum sway; side view = rotateY(±80°), front view = 0.
 */

const DWELL_MS = 1000; // front view held for 1s …
const TURN_MS = 650; // … plus the turn / slide transition
const STEP_MS = DWELL_MS + TURN_MS;
const RESUME_MS = 4500; // idle time after manual input before autoplay resumes
const HOVER_INTENT_MS = 160; // pointer must rest on a garment this long to select it
const SIDE_ANGLE = 80;
const N = PRODUCTS.length;
const HALF = Math.floor(N / 2);

/** Real-life size: tops by height, everything else by width (cm, laid flat / hung). */
const TOP_HEIGHT_CM = 62;
const WIDTH_CM: Record<Exclude<ProductCategory, "top">, number> = {
  bra: 34,
  panty: 30,
  print: 30,
  brief: 32,
  trunk: 36,
};
const realSize = (p: Product) => {
  const ratio = p.w / p.h;
  if (p.category === "top") return { w: TOP_HEIGHT_CM * ratio, h: TOP_HEIGHT_CM };
  const w = WIDTH_CM[p.category];
  return { w, h: w / ratio };
};
const REAL = PRODUCTS.map(realSize);
const MAX_W_CM = Math.max(...REAL.map((s) => s.w));
const MAX_H_CM = Math.max(...REAL.map((s) => s.h));
const MIN_W_CM = Math.min(...REAL.map((s) => s.w));

const firstIndexOf = (c: ProductCategory) => PRODUCTS.findIndex((p) => p.category === c);
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label])) as Record<
  ProductCategory,
  string
>;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const mod = (v: number) => ((v % N) + N) % N;
/** Signed distance on the loop, in [-HALF, N - HALF). */
const loopDist = (i: number, active: number) => mod(i - active + HALF) - HALF;
const isTop = (p: Product) => p.category === "top";

type Geo = {
  W: number;
  H: number;
  railY: number;
  hangerH: number; // hook + bar + clips
  slot: number; // spacing between side-view garments
  gapBase: number;
  offLimit: number; // |x| beyond this a garment is off-screen
  sizes: { w: number; h: number }[]; // drawn size of every garment (px)
};

function computeGeo(W: number, H: number): Geo {
  const hangerH = clamp(H * 0.1, 30, 56);
  const floor = clamp(H * 0.06, 14, 36);
  const share = W < 640 ? 0.9 : W / H < 1.05 ? 0.74 : 0.42; // widest garment vs stage width
  const shoulder = hangerH * 0.62;
  const ppc = Math.min((H - 10 - shoulder - floor) / MAX_H_CM, (W * share) / MAX_W_CM); // px per cm
  const sizes = REAL.map((s) => ({ w: s.w * ppc, h: s.h * ppc }));
  const tallest = shoulder + MAX_H_CM * ppc;
  const railY = clamp((H - floor - tallest) / 2, 8, H * 0.18);

  // Side garments are packed tightly, but the loop must always reach past both edges
  // so items wrapping round the back are never seen jumping.
  const maxW = MAX_W_CM * ppc;
  const margin = maxW * 0.16 + 12;
  let slot = clamp(W * 0.028, 16, 36);
  const gapBase = 6;
  const minExtra = (MIN_W_CM * ppc) / 2 + gapBase - slot / 2;
  slot = Math.max(slot, (W / 2 + margin - minExtra) / (HALF - 1));
  return { W, H, railY, hangerH, slot, gapBase, offLimit: W / 2 + margin, sizes };
}

/** Extra half-space either side of the front garment ("a little space"). */
const extraFor = (g: Geo, active: number) => {
  const w = g.sizes[active]!.w;
  return w / 2 + w * 0.06 + g.slot * 0.8 + g.gapBase - g.slot / 2;
};

/* ── Hanger artwork ──────────────────────────────────────────────────────── */

function Hanger({ w, h, kind }: { w: number; h: number; kind: "clip" | "bra" | "shoulder" }) {
  const cx = w / 2;
  const barY = h * 0.6;
  const hookR = Math.min(h * 0.17, 10);
  const hook = `M${cx} ${barY} V${hookR * 2.1} C${cx} ${hookR * 0.2} ${cx + hookR * 1.9} ${hookR * 0.2} ${cx + hookR * 1.9} ${hookR * 1.5} C${cx + hookR * 1.9} ${hookR * 2.3} ${cx + hookR * 1.2} ${hookR * 2.6} ${cx + hookR * 0.7} ${hookR * 2.4}`;
  if (kind === "shoulder") {
    const sw = w * 0.98;
    const x0 = cx - sw / 2;
    return (
      <svg
        aria-hidden
        width={w}
        height={h * 1.55}
        className="absolute left-0 top-0 overflow-visible"
      >
        <path
          d={hook}
          fill="none"
          stroke="url(#hr-brass)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <path
          d={`M${cx} ${barY} L${x0 + 6} ${h * 1.42} Q${x0} ${h * 1.5} ${x0 + 10} ${h * 1.5} H${x0 + sw - 10} Q${x0 + sw} ${h * 1.5} ${x0 + sw - 6} ${h * 1.42} Z`}
          fill="none"
          stroke="#2b1b20"
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
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
  onPick,
}: ItemProps) {
  const isActive = d === 0;
  const kind = isTop(product) ? "shoulder" : product.category === "bra" ? "bra" : "clip";

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

  const garmentTop = kind === "shoulder" ? hangerH * 0.62 : hangerH;
  const hookLift = hangerH * 0.14; // hook curls over the rail
  const near = Math.abs(d) <= 6;
  const turn = isActive ? 0 : d < 0 ? 180 - SIDE_ANGLE : SIDE_ANGLE; // crossing sides passes edge-on

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-0"
      style={{
        x: sx,
        visibility,
        width: w,
        marginLeft: -w / 2,
        top: railY - hookLift,
        zIndex: 200 - Math.abs(d) * 2,
      }}
    >
      {/* pendulum around the hook */}
      <motion.div style={{ rotate: sway, transformOrigin: `50% ${hookLift}px` }}>
        <motion.div
          style={{ transformOrigin: `50% ${hookLift}px` }}
          animate={idle && isActive ? { rotate: [0, 1.1, 0, -1.1, 0] } : { rotate: 0 }}
          transition={
            idle && isActive
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
            animate={{ rotateY: turn, scale: isActive ? 1 : 0.93 }}
            transition={{ type: "spring", stiffness: 120, damping: 19, mass: 0.9 }}
          >
            {kind === "shoulder" && <Hanger w={w} h={hangerH} kind={kind} />}
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
            {kind !== "shoulder" && <Hanger w={w} h={hangerH} kind={kind} />}
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
          left: isActive ? 0 : w / 2 - slot / 2,
          width: isActive ? w : slot,
          height: hangerH + h,
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
  id: ProductCategory;
  label: string;
  product: Product;
  on: boolean;
  onSelect: (c: ProductCategory) => void;
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

export type RailJump = { category: ProductCategory; nonce: number };

export function NewArrivals({ jump }: { jump?: RailJump | undefined }) {
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

  const pause = useCallback(() => {
    setPaused(true);
    setManual(true);
    clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => {
      setPaused(false);
      setManual(false);
    }, RESUME_MS);
  }, []);

  /** Select a garment; it always moves to the centre of the stage. */
  const select = useCallback((i: number) => setActive(mod(i)), []);
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

  /* External jumps (e.g. "Shop Men" from the collections cards) */
  useEffect(() => {
    if (!jump) return;
    pick(firstIndexOf(jump.category));
  }, [jump, pick]);

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

  /* Hover intent: the garment the (moving) mouse rests on is centred. Only real pointer
     movement counts, so a garment sliding under a still cursor is never auto-selected. */
  const hoverIntent = useRef<{
    idx: number;
    x: number;
    y: number;
    t?: ReturnType<typeof setTimeout>;
  }>({ idx: -1, x: 0, y: 0 });
  const clearHover = () => {
    clearTimeout(hoverIntent.current.t);
    hoverIntent.current.idx = -1;
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
    if (idx >= 0 && idx !== activeRef.current) {
      h.t = setTimeout(() => {
        h.idx = -1;
        select(idx);
        setManual(true);
      }, HOVER_INTENT_MS);
    }
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
  const pickCategory = useCallback((c: ProductCategory) => pick(firstIndexOf(c)), [pick]);
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
    return PRODUCTS.map((_, i) => {
      const d = loopDist(i, active);
      return { d, x: d * geo.slot + Math.sign(d) * extra };
    });
  }, [geo, active]);

  const catCount = PRODUCTS.filter((p) => p.category === activeCat).length;
  const catPos = active - firstIndexOf(activeCat) + 1;
  const activeSize = geo?.sizes[active];
  const shadowY =
    geo && activeSize
      ? geo.railY + (isTop(current) ? geo.hangerH * 0.62 : geo.hangerH) + activeSize.h + 6
      : 0;

  return (
    <section
      ref={sectionRef}
      id="shop"
      aria-label="New arrivals"
      className="relative flex h-[100svh] min-h-[560px] flex-col overflow-hidden pb-4 pt-[5.6rem] wide:pb-6 wide:pt-[6.4rem]"
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
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-col gap-3 px-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            The collection
          </p>
          <h2 className="mt-2 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl [@media(max-height:720px)]:text-4xl">
            New <span className="font-semibold italic text-primary">arrivals</span>
          </h2>
        </div>
        <div
          ref={chipsRef}
          role="tablist"
          aria-label="Product categories"
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 xl:mx-0 xl:px-0"
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
        className="relative mt-3 min-h-0 flex-1 select-none overflow-hidden outline-none [touch-action:pan-y] wide:mt-5"
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
              scaleX: clamp(activeSize.w / 300, 0.5, 1.4),
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
              onPick={pick}
            />
          ))}
      </div>

      {/* Active product + controls */}
      <div className="mx-auto mt-2 flex w-full max-w-6xl shrink-0 items-center gap-3 px-5 wide:mt-3">
        <button
          type="button"
          aria-label="Previous product"
          onClick={() => step(-1)}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background/70 transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          className="min-w-0 flex-1 text-center"
          aria-live={manual ? "polite" : "off"}
          aria-atomic
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <p className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
                {current.name}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: current.hex }}
                />
                {current.colour} · {CATEGORY_LABEL[activeCat]} {catPos}/{catCount}
              </p>
            </motion.div>
          </AnimatePresence>
          {/* 1-second dwell progress */}
          <div className="mx-auto mt-2 h-[2px] w-24 overflow-hidden rounded-full bg-foreground/10">
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

        <button
          type="button"
          aria-label="Next product"
          onClick={() => step(1)}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background/70 transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
