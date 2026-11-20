import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import womenWide1672 from "@/assets/hero/every-body-women-wide-1672.webp";
import womenWide1120 from "@/assets/hero/every-body-women-wide-1120.webp";
import womenTall941 from "@/assets/hero/every-body-women-tall-941.webp";
import womenTall640 from "@/assets/hero/every-body-women-tall-640.webp";
import menWide1672 from "@/assets/hero/every-body-men-wide-1672.webp";
import menWide1120 from "@/assets/hero/every-body-men-wide-1120.webp";
import menTall941 from "@/assets/hero/every-body-men-tall-941.webp";
import menTall640 from "@/assets/hero/every-body-men-tall-640.webp";

/**
 * "Every body" hero — the women's campaign artwork, then the men's, sliding on in a
 * loop. Wide artwork on landscape screens, tall artwork on portrait screens.
 *
 * Hair movement: each woman's hair is a small copy of the *same decoded image*
 * (no extra download), clipped with a soft mask and swung around the crown with a
 * CSS transform animation. Transform-only → runs on the compositor, cheap on phones,
 * and paused whenever the slide or the section is not visible.
 *
 * Regenerate the images with scratch/generate-every-body-hero.mjs.
 */

const SLIDE_MS = 4500;
const TALL = "(max-aspect-ratio: 1/1)";

/** Hair strand: region [x, y, w, h], pivot [px, py] (image px), swing angle (deg), period (s), delay (s). */
type Strand = {
  r: [number, number, number, number];
  p: [number, number];
  a: number;
  d: number;
  delay: number;
};
type Art = { w: number; h: number; hair: Strand[] };

const WOMEN_WIDE: Art = {
  w: 1672,
  h: 941,
  hair: [
    { r: [395, 270, 118, 84], p: [470, 336], a: 1.6, d: 4.6, delay: 0 }, // curls, left
    { r: [592, 256, 46, 132], p: [632, 268], a: 3.2, d: 3.6, delay: -1.2 }, // ponytail
    { r: [772, 284, 46, 148], p: [812, 286], a: 2.2, d: 4.2, delay: -2.1 }, // long waves
    { r: [966, 254, 40, 48], p: [996, 292], a: 4, d: 3.2, delay: -0.6 }, // bun
    { r: [1143, 260, 94, 94], p: [1200, 330], a: 1.8, d: 4.9, delay: -2.8 }, // curls, right
  ],
};
const WOMEN_TALL: Art = {
  w: 941,
  h: 1672,
  hair: [
    { r: [56, 750, 112, 76], p: [130, 815], a: 1.6, d: 4.6, delay: 0 },
    { r: [222, 730, 46, 140], p: [260, 742], a: 3.2, d: 3.6, delay: -1.2 },
    { r: [390, 766, 48, 168], p: [430, 768], a: 2.2, d: 4.2, delay: -2.1 },
    { r: [576, 720, 42, 50], p: [608, 762], a: 4, d: 3.2, delay: -0.6 },
    { r: [740, 728, 94, 98], p: [810, 800], a: 1.8, d: 4.9, delay: -2.8 },
  ],
};

type Slide = {
  id: "women" | "men";
  label: string;
  title: string;
  wide: { src: string; set: string };
  tall: { src: string; set: string };
  edges: [string, string]; // wall colour at the left / right edge of the artwork
  hair?: { wide: Art; tall: Art };
};

const SLIDES: Slide[] = [
  {
    id: "women",
    label: "Women",
    title: "Beauty comes in every body",
    wide: { src: womenWide1672, set: `${womenWide1120} 1120w, ${womenWide1672} 1672w` },
    tall: { src: womenTall941, set: `${womenTall640} 640w, ${womenTall941} 941w` },
    edges: ["#e69c9c", "#e8afad"],
    hair: { wide: WOMEN_WIDE, tall: WOMEN_TALL },
  },
  {
    id: "men",
    label: "Men",
    title: "Comfort fits in every body",
    wide: { src: menWide1672, set: `${menWide1120} 1120w, ${menWide1672} 1672w` },
    tall: { src: menTall941, set: `${menTall640} 640w, ${menTall941} 941w` },
    edges: ["#f2aaab", "#eeb1b1"],
  },
];

/*
 * The headline is baked into the artwork, so the frame is placed so that its top
 * edge always lands just below the fixed navbar (bottom ≈ 82px), whatever the
 * zoom level / viewport size:
 *  --clear  y where the headline may start (navbar bottom + gap)
 *  --vh     section height (the section has min-height 520px)
 * Headline top as a fraction of the frame height, *after* the 1.035 Ken-Burns
 * zoom around the centre: wide ≈ 0.045 (men's, the higher of the two), tall ≈ 0.21.
 * The frame fades out on all four sides (the top fade ends just above the headline), so
 * its edges never show as a hard line against the wall colour behind it.
 */
const CSS = `
.eb-frame{position:absolute;left:50%;aspect-ratio:1672/941;
  --clear:96px;--vh:max(100svh,520px);
  --ih:max(calc((var(--vh) - 154px) / 0.848),320px);height:var(--ih);
  top:calc(var(--clear) - 0.045 * var(--ih));transform:translateX(-50%);
  --fade-top:4%;--fade-bottom:90%;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%),
    linear-gradient(180deg,transparent 0,#000 var(--fade-top),#000 var(--fade-bottom),transparent 100%);
  -webkit-mask-composite:source-in;
  mask-image:linear-gradient(90deg,transparent 0,#000 9%,#000 91%,transparent 100%),
    linear-gradient(180deg,transparent 0,#000 var(--fade-top),#000 var(--fade-bottom),transparent 100%);
  mask-composite:intersect}
.eb-tall-only{display:none}
@media ${TALL}{
  .eb-frame{aspect-ratio:941/1672;--fade-top:12%;--fade-bottom:92%;--ih:max(var(--vh),calc(100vw * 1672 / 941));
    top:max(calc(var(--clear) - 0.21 * var(--ih)),min(0px,calc(var(--vh) - 92px - 0.828 * var(--ih))))}
  .eb-wide-only{display:none}.eb-tall-only{display:block}
}
.eb-zoom{transition:transform 7.5s linear;transform:scale(1)}
.eb-on .eb-zoom{transform:scale(1.035)}
.eb-hair{position:absolute;background-repeat:no-repeat;will-change:transform;
  -webkit-mask-image:radial-gradient(closest-side,#000 62%,transparent 100%);
  mask-image:radial-gradient(closest-side,#000 62%,transparent 100%);
  animation:eb-sway var(--d) ease-in-out var(--delay) infinite;animation-play-state:paused}
.eb-on.eb-live .eb-hair{animation-play-state:running}
@keyframes eb-sway{
  0%,100%{transform:rotate(0deg)}
  30%{transform:rotate(var(--a))}
  62%{transform:rotate(calc(var(--a) * -0.55))}
  82%{transform:rotate(calc(var(--a) * 0.25))}
}
.eb-light{animation:eb-light 9s ease-in-out infinite;animation-play-state:paused}
.eb-on.eb-live .eb-light{animation-play-state:running}
@keyframes eb-light{0%,100%{opacity:0}50%{opacity:.55}}
@keyframes eb-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion: reduce){
  .eb-hair,.eb-light{animation:none}.eb-zoom,.eb-on .eb-zoom{transition:none;transform:none}
}
`;

/** One hair strand: a masked crop of the artwork, swinging around the crown. */
function HairStrand({ art, s, src }: { art: Art; s: Strand; src: string }) {
  const [x, y, w, h] = s.r;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <span
      aria-hidden
      className="eb-hair"
      style={
        {
          left: pct(x, art.w),
          top: pct(y, art.h),
          width: pct(w, art.w),
          height: pct(h, art.h),
          backgroundImage: `url("${src}")`,
          backgroundSize: `${(art.w / w) * 100}% ${(art.h / h) * 100}%`,
          backgroundPosition: `${(x / (art.w - w)) * 100}% ${(y / (art.h - h)) * 100}%`,
          transformOrigin: `${((s.p[0] - x) / w) * 100}% ${((s.p[1] - y) / h) * 100}%`,
          "--a": `${s.a}deg`,
          "--d": `${s.d}s`,
          "--delay": `${s.delay}s`,
        } as CSSProperties
      }
    />
  );
}

function SlideArt({ slide, first }: { slide: Slide; first: boolean }) {
  // The hair layers reuse whichever file the <picture> picked (already decoded).
  const [src, setSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sync = () => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) setSrc(img.currentSrc || img.src);
  };
  useEffect(sync, []);

  return (
    <div className="eb-frame">
      <div className="eb-zoom relative h-full w-full">
        <picture>
          <source
            media={TALL}
            srcSet={slide.tall.set}
            sizes="max(100vw, 56.3svh)"
            width={941}
            height={1672}
          />
          <img
            ref={imgRef}
            src={slide.wide.src}
            srcSet={slide.wide.set}
            sizes="100vw"
            alt=""
            width={1672}
            height={941}
            decoding="async"
            fetchPriority={first ? "high" : "low"}
            draggable={false}
            onLoad={sync}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />
        </picture>
        {slide.hair && src && (
          <>
            <div className="eb-wide-only absolute inset-0">
              {slide.hair.wide.hair.map((s, k) => (
                <HairStrand key={k} art={slide.hair!.wide} s={s} src={src} />
              ))}
            </div>
            <div className="eb-tall-only absolute inset-0">
              {slide.hair.tall.hair.map((s, k) => (
                <HairStrand key={k} art={slide.hair!.tall} s={s} src={src} />
              ))}
            </div>
          </>
        )}
        {/* Window light gently brightening and fading */}
        <div
          aria-hidden
          className="eb-light pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 82% 18%, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0) 70%)",
          }}
        />
      </div>
    </div>
  );
}

/**
 * `intro`: this load plays the intro logo, so the hero plays its entrance as the logo fades
 * (artwork settles from a gentle zoom, dots rise; CSS in styles.css).
 */
export function EveryBodyHero({ intro = false }: { intro?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  // Slide positions: -1 left (leaving), 0 on screen, 1 waiting on the right.
  const [pos, setPos] = useState<number[]>(() => SLIDES.map((_, i) => (i === 0 ? 0 : 1)));
  const [instant, setInstant] = useState<boolean[]>(() => SLIDES.map(() => true));
  const [live, setLive] = useState(true); // section visible and tab in front
  const [cycle, setCycle] = useState(0); // restarts the autoplay timer after manual moves

  /* Pause everything while the hero is off-screen or the tab is hidden */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let inView = true;
    const update = () => setLive(inView && document.visibilityState === "visible");
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([e]) => {
            inView = !!e?.isIntersecting;
            update();
          })
        : null;
    io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  /** Move to slide `to`; `dir` 1 = the new slide comes in from the right. */
  const go = useCallback(
    (to: number, dir: 1 | -1 = 1) => {
      if (to === active) return;
      // 1. park the incoming slide on the side it enters from (no transition) …
      setInstant(SLIDES.map((_, i) => i === to));
      setPos((p) => p.map((v, i) => (i === to ? dir : v)));
      // 2. … then, next frame, slide both.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setInstant(SLIDES.map(() => false));
          setPos(SLIDES.map((_, i) => (i === to ? 0 : i === active ? -dir : dir)));
          setActive(to);
        }),
      );
    },
    [active],
  );
  const next = useCallback(() => go((active + 1) % SLIDES.length, 1), [active, go]);
  const prev = useCallback(
    () => go((active - 1 + SLIDES.length) % SLIDES.length, -1),
    [active, go],
  );

  /* Autoplay: women → men → women … */
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(t);
  }, [live, next, cycle]);

  /* Swipe (touch keeps vertical page scrolling) */
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.3) {
      if (dx < 0) next();
      else prev();
      setCycle((c) => c + 1);
    }
  };

  const slide = SLIDES[active]!;

  return (
    <section
      ref={sectionRef}
      id="drop"
      aria-roledescription="carousel"
      aria-label="RIDOZ — innerwear for every body"
      className={`relative h-[100svh] min-h-[520px] overflow-hidden bg-[#f3bbbd] [touch-action:pan-y] ${intro ? "hero-intro" : ""}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      <style>{CSS}</style>
      <h1 className="sr-only">RIDOZ innerwear — {slide.title}</h1>

      <div className="hero-enter-slides absolute inset-0">
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`${s.label}: ${s.title}`}
          aria-hidden={i !== active}
          className={`absolute inset-0 overflow-hidden ${i === active ? "eb-on" : ""} ${live ? "eb-live" : ""}`}
          style={{
            transform: `translate3d(${pos[i]! * 100}%,0,0)`,
            transition: instant[i] ? "none" : "transform 1.15s cubic-bezier(0.65, 0, 0.2, 1)",
            visibility: pos[i] === 0 || !instant[i] ? "visible" : "hidden",
            background: `linear-gradient(90deg, ${s.edges[0]}, ${s.edges[1]})`,
          }}
        >
          <SlideArt slide={s} first={i === 0} />
        </div>
      ))}
      </div>

      {/* Soft fade into the next section, so the pages flow instead of meeting at a hard edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[clamp(72px,13svh,140px)]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--background) 0%, transparent) 0%, color-mix(in srgb, var(--background) 45%, transparent) 45%, color-mix(in srgb, var(--background) 85%, transparent) 75%, var(--background) 100%)",
        }}
      />

      {/* Slide dots */}
      <div className="hero-enter-ui absolute inset-x-0 bottom-3 z-10 flex justify-center px-5 sm:bottom-4">
        <div role="tablist" aria-label="Choose campaign" className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={s.label}
              onClick={() => {
                go(i, i > active ? 1 : -1);
                setCycle((c) => c + 1);
              }}
              className="flex h-11 cursor-pointer items-center px-1"
            >
              <span
                className={`relative block h-1.5 overflow-hidden rounded-full bg-[#6e1630]/25 transition-[width] duration-500 ${
                  i === active ? "w-10" : "w-4"
                }`}
              >
                {i === active && live && (
                  <span
                    key={`${active}-${cycle}`}
                    className="absolute inset-0 origin-left rounded-full bg-[#6e1630]"
                    style={{ animation: `eb-progress ${SLIDE_MS}ms linear forwards` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
