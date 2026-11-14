import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Feather, Layers, ShieldCheck } from "lucide-react";

import pantyRaniPink from "@/assets/showcase/trio/panty-rani-pink.webp";
import pantyRoseClay from "@/assets/showcase/trio/panty-rose-clay.webp";
import pantyMidnightNavy from "@/assets/showcase/trio/panty-midnight-navy.webp";
import pantyOrchidMauve from "@/assets/showcase/trio/panty-orchid-mauve.webp";
import pantyEmerald from "@/assets/showcase/trio/panty-emerald.webp";
import pantyCherryRed from "@/assets/showcase/trio/panty-cherry-red.webp";
import silkCrimson from "@/assets/showcase/trio/silk-crimson.webp";
import silkSky from "@/assets/showcase/trio/silk-sky.webp";
import podium from "@/assets/showcase/trio/podium.webp";
import cotton from "@/assets/showcase/trio/cotton.webp";
import leafShadow from "@/assets/showcase/trio/leaf-shadow.webp";
import ridozWordmark from "@/assets/showcase/trio/ridoz-wordmark.webp";

/**
 * "The 3-Piece Box" — the RIDOZ Panties window carton on a stone podium.
 * Each panty lifts out of the box in turn (autoplay); hover (desktop) or tap
 * (touch) a panty to lift it directly. Two boxes: Crimson and Sky Blue.
 *
 * Performance: every image is a pre-rendered WebP (scratch/generate-trio-box-assets.mjs),
 * so nothing is tinted, blurred or blended at runtime — animations are transform/opacity only.
 */

type Panty = { name: string; color: string; image: string };
type BoxVariant = {
  id: string;
  label: string;
  bg: string; // carton front
  top: string; // carton top face
  side: string; // carton side face
  interior: string; // inside of the box, through the window
  logo: string; // RIDOZ wordmark
  ui: string; // accessible accent for controls (white text on it)
  silk: string;
  panties: [Panty, Panty, Panty];
};

const BOXES: BoxVariant[] = [
  {
    id: "crimson",
    label: "Crimson box",
    bg: "#b11f39",
    top: "#c93a52",
    side: "#7f1428",
    interior: "linear-gradient(180deg,#22050d 0%,#4a0c1b 100%)",
    logo: "#f2d34a",
    ui: "#a51538",
    silk: silkCrimson,
    panties: [
      { name: "Orchid Mauve", color: "#b4609f", image: pantyOrchidMauve },
      { name: "Emerald", color: "#119270", image: pantyEmerald },
      { name: "Cherry Red", color: "#c8102e", image: pantyCherryRed },
    ],
  },
  {
    id: "sky",
    label: "Sky Blue box",
    bg: "#2aaee2",
    top: "#5cc4ec",
    side: "#1784b6",
    interior: "linear-gradient(180deg,#082c42 0%,#114f72 100%)",
    logo: "#1462b6",
    ui: "#0f6f9f",
    silk: silkSky,
    panties: [
      { name: "Rani Pink", color: "#e0336b", image: pantyRaniPink },
      { name: "Rose Clay", color: "#c27f6c", image: pantyRoseClay },
      { name: "Midnight Navy", color: "#26336f", image: pantyMidnightNavy },
    ],
  },
];

const ALL_PANTY_IMAGES = BOXES.flatMap((b) => b.panties.map((p) => p.image));

const AUTOPLAY_MS = 2800;
const WIDE_QUERY = "(min-width: 1024px), (min-width: 768px) and (orientation: landscape)"; // keep in sync with @custom-variant wide
const MOBILE_GAPS = 20; // flex gaps between intro / stage / controls on phones
const MIN_STAGE_MOBILE = 170; // smallest podium scene before the layout scales down
const MANUAL_PAUSE_MS = 6000;
const ease = [0.22, 1, 0.36, 1] as const;
const liftSpring = { type: "spring", stiffness: 170, damping: 22, mass: 0.9 } as const;

/* ── Box geometry — all in cqw of the box front width ───────────────────── */
const BOX_RATIO = 2.45; // front face width : height
const BOX_H = 100 / BOX_RATIO; // ≈ 40.8cqw
const TOP_D = 3; // top face visible depth
const SIDE_W = 5; // side face width
const WIN = { left: 14.5, width: 71, top: 3, height: 34 }; // % of front face
const COL_W = WIN.width / 3;
const PANTY_W = 23; // panty width in the window
const PANTY_ASPECT = 742 / 650; // trimmed source aspect
const PANTY_H = PANTY_W / PANTY_ASPECT;
const PANTY_TOP = (WIN.top / 100) * BOX_H + 4; // waistband sits a little below the window top
const LIFT_SCALE = 2;
const LIFT_GAP = 2.5; // gap between lifted panty and the box top
const HEADROOM = TOP_D + LIFT_GAP + PANTY_H * LIFT_SCALE + 1.5;
const colCenter = (i: number) => WIN.left + COL_W * (i + 0.5);
const cq = (n: number) => `${n}cqw`;

// Window cut-out (mask-position % is relative to container − mask size).
const windowMask: CSSProperties = (() => {
  const px = (WIN.left / (100 - WIN.width)) * 100;
  const py = (WIN.top / (100 - WIN.height)) * 100;
  const hole = `linear-gradient(#000 0 0) ${px}% ${py}% / ${WIN.width}% ${WIN.height}% no-repeat`;
  const full = "linear-gradient(#000 0 0)";
  return {
    WebkitMask: `${hole}, ${full}`,
    WebkitMaskComposite: "xor",
    mask: `${hole}, ${full}`,
    maskComposite: "exclude",
  } as CSSProperties;
})();

const windowRect: CSSProperties = {
  left: `${WIN.left}%`,
  width: `${WIN.width}%`,
  top: `${WIN.top}%`,
  height: `${WIN.height}%`,
};

export function TrioBoxShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.4 });
  const nearView = useInView(sectionRef, { once: true, margin: "600px 0px" });
  const reduceMotion = useReducedMotion();

  const [boxIdx, setBoxIdx] = useState(0);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const box = BOXES[boxIdx] ?? BOXES[0]!;
  const current = box.panties[active] ?? box.panties[0];
  const lifted = inView || hovering || !!reduceMotion;
  const autoplay = inView && !hovering && !manualPause && !reduceMotion;

  // Warm the cache for every panty image before the section is reached,
  // so switching boxes never shows a blank frame.
  useEffect(() => {
    if (!nearView) return;
    for (const src of ALL_PANTY_IMAGES) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [nearView]);

  // Autoplay: lift each panty in turn, then move on to the other box.
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => {
      if (active < 2) setActive(active + 1);
      else {
        setActive(0);
        setBoxIdx((b) => (b + 1) % BOXES.length);
      }
    }, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [autoplay, active, boxIdx]);

  useEffect(
    () => () => {
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    },
    [],
  );

  const pauseBriefly = useCallback(() => {
    setManualPause(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setManualPause(false), MANUAL_PAUSE_MS);
  }, []);

  const selectPanty = useCallback(
    (i: number) => {
      setActive(i);
      pauseBriefly();
    },
    [pauseBriefly],
  );

  const selectBox = useCallback(
    (b: number) => {
      setBoxIdx(b);
      setActive(0);
      pauseBriefly();
    },
    [pauseBriefly],
  );

  // Fit-to-screen: the stage already shrinks to the space left over (CSS container
  // units). If the text alone is taller than the screen (very short viewports),
  // scale the whole layout down just enough — never up.
  const fitOuterRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const outer = fitOuterRef.current;
    const intro = introRef.current;
    const controls = controlsRef.current;
    if (!outer || !intro || !controls) return;
    const desktop = window.matchMedia(WIDE_QUERY);
    const measure = () => {
      const available = outer.clientHeight;
      if (!available) return;
      const needed =
        intro.offsetHeight +
        controls.offsetHeight +
        (desktop.matches ? 0 : MOBILE_GAPS + MIN_STAGE_MOBILE);
      const next = Math.max(0.6, Math.min(1, available / needed));
      setFit((prev) => (Math.abs(prev - next) > 0.008 ? next : prev));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(intro);
    ro.observe(controls);
    desktop.addEventListener("change", measure);
    measure();
    return () => {
      ro.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, []);

  const fitStyle: CSSProperties =
    fit < 1
      ? {
          width: `${100 / fit}%`,
          height: `${100 / fit}%`,
          transform: `scale(${fit})`,
          transformOrigin: "0 0",
        }
      : { width: "100%", height: "100%" };

  return (
    <section
      ref={sectionRef}
      id="trio-box"
      aria-label="RIDOZ Panties — 3-piece box"
      className="relative isolate h-[100svh] min-h-[540px] overflow-hidden"
    >
      {/* Static backdrop: window light + leaf shadow (page background comes from the body) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(118deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 38%), radial-gradient(45% 50% at 72% 42%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 70%)",
        }}
      />
      <img
        aria-hidden
        alt=""
        src={leafShadow}
        width={560}
        height={413}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -right-[6%] top-[9%] -z-10 w-[62vw] max-w-[620px] select-none opacity-[0.16] wide:top-[6%] wide:w-[38vw]"
      />

      {/* Content area: below the fixed navbar, above the bottom edge */}
      <div
        ref={fitOuterRef}
        className="absolute inset-x-0 bottom-3 top-[5.25rem] wide:bottom-5 wide:top-[6.25rem]"
      >
        <div style={fitStyle}>
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-2.5 px-5 wide:grid wide:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] wide:grid-rows-[1fr_auto_auto_1fr] wide:gap-x-10 wide:gap-y-0 wide:px-8 lg:px-12">
            {/* Intro */}
            <div ref={introRef} className="shrink-0 wide:col-start-1 wide:row-start-2">
              <p className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.3em] text-primary sm:text-xs">
                The 3-piece box <span aria-hidden className="h-px w-12 bg-primary/70 sm:w-16" />
              </p>
              <h2 className="mt-1.5 font-display text-[2.15rem] font-bold leading-[0.95] text-[#2a1216] sm:mt-3 sm:text-6xl lg:text-[4.2rem] wide:[@media(max-height:760px)]:text-[3.4rem]">
                Feel the <span className="italic font-semibold text-primary">solace.</span>
              </h2>
              <p className="mt-2 max-w-md text-[12.5px] leading-snug text-[#3b2a2c] sm:mt-4 sm:text-base sm:leading-relaxed wide:[@media(max-height:760px)]:mt-2.5">
                Three <strong className="font-semibold">100%</strong> pure cotton panties in every
                box, made in India. Hover or tap the box to see each one.
              </p>
              <Features />
            </div>

            {/* Stage — sized from the space this cell gets */}
            <div
              className="relative -mx-5 flex min-h-0 flex-1 items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,#000_86%,transparent)] wide:[mask-image:none] wide:col-start-2 wide:row-span-4 wide:row-start-1 wide:mx-0 wide:overflow-visible"
              style={{ containerType: "size" }}
            >
              <Stage
                box={box}
                active={active}
                lifted={lifted}
                onHover={setHovering}
                onPick={(i) => setActive(i)}
                onSelect={selectPanty}
              />
            </div>

            {/* Details + controls */}
            <div
              ref={controlsRef}
              className="relative z-10 shrink-0 wide:col-start-1 wide:row-start-3 wide:pt-6 wide:[@media(max-height:760px)]:pt-4"
            >
              <ActiveDetails box={box} panty={current} />
              <Swatches box={box} active={active} autoplay={autoplay} onSelect={selectPanty} />
              <BoxToggle boxIdx={boxIdx} onSelect={selectBox} />
              <a
                href="#shop"
                className="mt-2 inline-flex min-h-10 items-center gap-1.5 border-b border-primary/60 text-[13px] font-semibold text-primary transition-colors hover:border-primary sm:mt-4 sm:min-h-11 sm:text-[15px] wide:[@media(max-height:760px)]:mt-2"
              >
                Explore the collection <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Feature row ────────────────────────────────────────────────────────── */

function CottonIcon({ className }: { className?: string }) {
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
      <path d="M7.5 14.5a3.5 3.5 0 0 1-.6-6.95A4 4 0 0 1 12 4a4 4 0 0 1 5.1 3.55 3.5 3.5 0 0 1-.6 6.95" />
      <path d="M7.5 14.5c1.2 0 2.4-.6 3-1.6M16.5 14.5c-1.2 0-2.4-.6-3-1.6M12 9.5v3.4" />
      <path d="M12 13v7M9.5 17.5 12 20l2.5-2.5" />
    </svg>
  );
}

const FEATURES: { icon: (p: { className?: string }) => ReactNode; label: ReactNode }[] = [
  {
    icon: CottonIcon,
    label: (
      <>
        <strong className="font-semibold">100%</strong>
        <br />
        Pure Cotton
      </>
    ),
  },
  {
    icon: (p) => <Feather strokeWidth={1.5} {...p} />,
    label: (
      <>
        Soft &amp;
        <br />
        Breathable
      </>
    ),
  },
  {
    icon: (p) => <Layers strokeWidth={1.5} {...p} />,
    label: (
      <>
        All-Day
        <br />
        Comfort
      </>
    ),
  },
  {
    icon: (p) => <ShieldCheck strokeWidth={1.5} {...p} />,
    label: (
      <>
        Skin
        <br />
        Friendly
      </>
    ),
  },
];

// One row of four on every screen size; dividers between items.
const FEATURE_BORDERS = ["border-r", "border-r", "border-r", ""];

function Features() {
  return (
    <ul className="mt-3 grid max-w-md grid-cols-4 sm:mt-5 lg:max-w-lg wide:[@media(max-height:760px)]:mt-3">
      {FEATURES.map(({ icon: Icon, label }, i) => (
        <li
          key={i}
          className={`flex flex-col items-center gap-1 border-primary/15 px-1 py-1.5 text-center text-[10.5px] leading-tight text-[#2f1e20] sm:text-[12px] wide:gap-1.5 wide:px-2 wide:py-2.5 wide:text-[13px] wide:[@media(max-height:760px)]:py-1.5 ${FEATURE_BORDERS[i]}`}
        >
          <Icon className="h-5 w-5 text-primary sm:h-6 sm:w-6 wide:h-7 wide:w-7" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Stage: podium, decor and the box ───────────────────────────────────── */

function Stage({
  box,
  active,
  lifted,
  onHover,
  onPick,
  onSelect,
}: {
  box: BoxVariant;
  active: number;
  lifted: boolean;
  onHover: (h: boolean) => void;
  onPick: (i: number) => void;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      className="relative w-[min(calc(100cqw/1.5),calc(100cqh/1.06),420px)] sm:w-[min(calc(100cqw/1.45),calc(100cqh/1.06),560px)] wide:w-[min(calc(100cqw/1.3),calc(100cqh/1.06),600px)]"
      style={{ containerType: "inline-size" }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && onHover(false)}
    >
      <div style={{ height: cq(HEADROOM) }} />

      {/* Box front-face frame; everything is positioned relative to it */}
      <div className="relative" style={{ height: cq(BOX_H) }}>
        {/* Satin drape (cross-fades with the box colour) */}
        {BOXES.map((b) => (
          <img
            key={b.id}
            aria-hidden
            alt=""
            src={b.silk}
            width={1400}
            height={788}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute max-w-none select-none transition-opacity duration-700 [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
            style={{
              left: cq(-40),
              top: `calc(100% - ${cq(110)})`,
              width: cq(300),
              opacity: b.id === box.id ? 1 : 0,
            }}
          />
        ))}

        {/* Glow arc behind the lifted panty */}
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: cq(-4),
            top: cq(-HEADROOM - 4),
            width: cq(108),
            height: cq(108),
            border: "1.5px solid rgba(255,255,255,0.95)",
            boxShadow: "0 0 24px 4px rgba(255,255,255,0.65), inset 0 0 40px rgba(255,255,255,0.35)",
            WebkitMaskImage: "linear-gradient(105deg, #000 0%, #000 22%, transparent 48%)",
            maskImage: "linear-gradient(105deg, #000 0%, #000 22%, transparent 48%)",
          }}
        />

        {/* Podium */}
        <img
          aria-hidden
          alt=""
          src={podium}
          width={1100}
          height={275}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute max-w-none select-none"
          style={{ left: cq(-17), top: `calc(100% - ${cq(14)})`, width: cq(140) }}
        />

        {/* The carton (switches with a short fade) */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={box.id}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease }}
          >
            <Carton box={box} active={active} lifted={lifted} />
          </motion.div>
        </AnimatePresence>

        {/* Cotton sprig in front */}
        <img
          aria-hidden
          alt=""
          src={cotton}
          width={420}
          height={341}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute z-30 max-w-none select-none"
          style={{ left: cq(-29), top: `calc(100% - ${cq(13)})`, width: cq(34) }}
        />

        {/* Hit zones — one per panty, over the box front */}
        {box.panties.map((p, i) => (
          <button
            key={p.name}
            type="button"
            aria-label={`Show ${p.name} panty`}
            aria-pressed={i === active}
            onClick={() => onSelect(i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && onPick(i)}
            onFocus={() => onPick(i)}
            className="absolute z-40 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            style={{
              left: `${WIN.left + COL_W * i}%`,
              width: `${COL_W}%`,
              top: cq(-TOP_D),
              bottom: 0,
            }}
          />
        ))}
      </div>

      {/* Visible podium below the box (rest overflows into the section) */}
      <div style={{ height: cq(20) }} />
    </div>
  );
}

function Carton({ box, active, lifted }: { box: BoxVariant; active: number; lifted: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* Top face */}
      <div
        aria-hidden
        className="absolute left-0"
        style={{
          top: cq(-TOP_D),
          height: cq(TOP_D),
          width: `calc(100% + ${cq(SIDE_W)})`,
          background: box.top,
          clipPath: `polygon(${cq(SIDE_W)} 0, 100% 0, calc(100% - ${cq(SIDE_W)}) 100%, 0 100%)`,
        }}
      />
      {/* Side face */}
      <div
        aria-hidden
        className="absolute left-full"
        style={{
          top: cq(-TOP_D),
          width: cq(SIDE_W),
          height: `calc(100% + ${cq(TOP_D)})`,
          background: `linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.25) 100%), ${box.side}`,
          clipPath: `polygon(0 ${cq(TOP_D)}, 100% 0, 100% calc(100% - ${cq(TOP_D)}), 0 100%)`,
        }}
      />

      {/* Inside of the box */}
      <div aria-hidden className="absolute" style={{ ...windowRect, background: box.interior }} />

      {/* Soft shadow the lifted panty casts on the box top */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-[5]"
        style={{
          left: "25%",
          width: "50%",
          top: cq(-TOP_D - 2),
          height: cq(6),
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(40,5,15,0.35) 0%, rgba(40,5,15,0) 100%)",
        }}
        initial={false}
        animate={{ opacity: lifted ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Panties */}
      {box.panties.map((p, i) => {
        const isUp = lifted && i === active;
        const dx = ((50 - colCenter(i)) / PANTY_W) * 100; // → centre of the box, in % of panty width
        const dy = ((-(PANTY_TOP + PANTY_H) - TOP_D - LIFT_GAP) / PANTY_H) * 100; // bottom above the box top
        return (
          <motion.img
            key={p.name}
            src={p.image}
            alt=""
            aria-hidden
            width={560}
            height={491}
            draggable={false}
            decoding="async"
            className="pointer-events-none absolute z-10 max-w-none select-none"
            style={{
              left: cq(colCenter(i) - PANTY_W / 2),
              top: cq(PANTY_TOP),
              width: cq(PANTY_W),
              transformOrigin: "50% 100%",
              willChange: "transform",
            }}
            initial={false}
            animate={
              isUp
                ? { x: `${dx}%`, y: `${dy}%`, scale: LIFT_SCALE }
                : { x: "0%", y: "0%", scale: 1 }
            }
            transition={liftSpring}
          />
        );
      })}

      {/* Window inner shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[15]"
        style={{
          ...windowRect,
          boxShadow:
            "inset 0 1.4cqw 1.6cqw -0.5cqw rgba(0,0,0,0.5), inset 0 -0.4cqw 0.8cqw rgba(0,0,0,0.25)",
        }}
      />

      {/* Carton front with the window cut out */}
      <div
        className="pointer-events-none absolute inset-0 z-20 text-white"
        style={{ background: box.bg, ...windowMask }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/15" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />

        <span
          className="absolute whitespace-nowrap"
          style={{
            left: "5.8%",
            top: "64%",
            transform: "translate(-50%, -50%) rotate(-90deg)",
            fontFamily: "'Kaushan Script', cursive",
            fontSize: cq(3.5),
          }}
        >
          Feel the solace
        </span>

        <div
          className="absolute text-center leading-none"
          style={{ left: "14.5%", top: "56%", width: "14%" }}
        >
          <div className="font-sans font-bold" style={{ fontSize: cq(3) }}>
            100%
          </div>
          <div
            className="font-sans font-medium uppercase opacity-90"
            style={{ fontSize: cq(1.05), marginTop: cq(0.6) }}
          >
            Pure cotton
          </div>
          <div
            className="font-sans font-semibold uppercase"
            style={{ fontSize: cq(1.05), marginTop: cq(0.3) }}
          >
            Made in India
          </div>
        </div>

        <div
          className="absolute flex flex-col items-center"
          style={{ left: "30%", width: "38%", top: "47%" }}
        >
          {/* Brand wordmark (RIDOZ with "Style" in the O), tinted per box via mask */}
          <div
            role="img"
            aria-label="RIDOZ Style"
            className="w-full"
            style={{
              aspectRatio: "1200 / 347",
              backgroundColor: box.logo,
              WebkitMaskImage: `url(${ridozWordmark})`,
              maskImage: `url(${ridozWordmark})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          />
          <div
            className="font-sans font-medium uppercase"
            style={{
              color: box.logo,
              fontSize: cq(2.8),
              letterSpacing: "0.32em",
              marginRight: "-0.32em",
              marginTop: cq(1.6),
            }}
          >
            Panties
          </div>
        </div>

        <svg
          aria-hidden
          viewBox="0 0 60 36"
          className="absolute"
          style={{ left: "71%", top: "57%", width: "8.5%" }}
        >
          <path d="M2 3 H58 L53 14 C45 19 39 26 37 34 H23 C21 26 15 19 7 14 Z" fill="#fff" />
          <path d="M4 8 H56" stroke={box.bg} strokeWidth="1.4" fill="none" />
          <path
            d="M8 14 C16 18 22 25 24 33 M52 14 C44 18 38 25 36 33"
            stroke={box.bg}
            strokeWidth="1.4"
            fill="none"
          />
        </svg>

        <div
          className="absolute flex items-center justify-center rounded-full bg-white font-sans font-bold uppercase"
          style={{
            left: "90.5%",
            top: "62%",
            width: cq(21),
            height: cq(4.6),
            transform: "translate(-50%, -50%) rotate(-90deg)",
            color: box.bg,
            fontSize: cq(1.95),
            letterSpacing: "0.05em",
          }}
        >
          3 Pieces
        </div>
      </div>

      {/* Plastic window film */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[25] overflow-hidden"
        style={windowRect}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
        <div className="absolute -top-1/2 left-[42%] h-[200%] w-[10%] rotate-[24deg] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>
    </div>
  );
}

/* ── Details + controls ─────────────────────────────────────────────────── */

function ActiveDetails({ box, panty }: { box: BoxVariant; panty: Panty }) {
  return (
    <div
      aria-live="polite"
      className="min-h-[52px] sm:min-h-[76px] wide:[@media(max-height:760px)]:min-h-[64px]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${box.id}-${panty.name}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease }}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 shrink-0 rounded-full"
              style={{ backgroundColor: panty.color }}
            />
            <h3 className="font-display text-[1.45rem] font-bold leading-tight text-[#2a1216] sm:text-[2rem]">
              {panty.name}
            </h3>
          </div>
          <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] sm:mt-1 text-[#3b2a2c] sm:text-[13px] sm:tracking-[0.2em]">
            {box.label}
            <span className="max-[379px]:hidden"> · 100% pure cotton</span> · 3 pieces
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Swatches({
  box,
  active,
  autoplay,
  onSelect,
}: {
  box: BoxVariant;
  active: number;
  autoplay: boolean;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Panties in this box"
      className="mt-2 flex gap-2.5 sm:mt-4 sm:gap-3 wide:[@media(max-height:760px)]:mt-2.5"
    >
      {box.panties.map((p, i) => {
        const isActive = i === active;
        return (
          <button
            key={p.name}
            type="button"
            aria-label={p.name}
            aria-pressed={isActive}
            onClick={() => onSelect(i)}
            className="relative flex h-11 w-11 cursor-pointer sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/70 outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle
                cx="24"
                cy="24"
                r="22.5"
                fill="none"
                stroke="#2a1216"
                strokeOpacity={0.12}
                strokeWidth="1.5"
              />
              {isActive && (
                <motion.circle
                  key={`ring-${box.id}-${active}-${autoplay}`}
                  cx="24"
                  cy="24"
                  r="22.5"
                  fill="none"
                  stroke={p.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={{ pathLength: autoplay ? 0 : 1 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: autoplay ? AUTOPLAY_MS / 1000 : 0.2, ease: "linear" }}
                />
              )}
            </svg>
            <span
              className="h-7 w-7 rounded-full transition-transform sm:h-8 sm:w-8 duration-200"
              style={{ backgroundColor: p.color, transform: isActive ? "scale(1)" : "scale(0.85)" }}
            />
          </button>
        );
      })}
    </div>
  );
}

function BoxToggle({ boxIdx, onSelect }: { boxIdx: number; onSelect: (b: number) => void }) {
  // Sky Blue first, as in the design.
  const order = [1, 0];
  return (
    <div
      role="group"
      aria-label="Choose a box"
      className="mt-2.5 flex flex-wrap gap-2 sm:mt-4 sm:gap-3 wide:[@media(max-height:760px)]:mt-3"
    >
      {order.map((i) => {
        const b = BOXES[i]!;
        const isActive = i === boxIdx;
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(i)}
            className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[11px] sm:min-h-11 font-semibold uppercase tracking-[0.1em] shadow-sm transition-colors duration-200 sm:px-5 sm:text-[13px] ${
              isActive
                ? "border-transparent text-white"
                : "border-[#2a1216]/15 bg-white/80 text-[#2a1216] hover:border-primary/50"
            }`}
            style={isActive ? { backgroundColor: b.ui } : undefined}
          >
            {isActive ? (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <span className="h-3 w-5 rounded-[3px]" style={{ backgroundColor: b.bg }} />
            )}
            <span>
              {b.label.replace(" box", "")}
              <span className="max-[379px]:hidden"> box</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
