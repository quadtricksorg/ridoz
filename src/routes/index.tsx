import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent, type TouchEvent } from "react";
import {
  motion,
  AnimatePresence,
  MotionConfig,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type Variants,
} from "framer-motion";
import { Phone, Menu, X, ArrowUpRight, Star, Instagram, Facebook, Youtube, Wind, Feather, ShieldCheck, Leaf, Move } from "lucide-react";
import { Magnet } from "@/components/ui/magnetic";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { RandomLetterSwap } from "@/components/ui/random-letter-swap";
import vest from "@/assets/c-vest.png";
import trunk from "@/assets/c-trunk.png";
import bra from "@/assets/c-bra.png";
import brief from "@/assets/c-brief.png";
import panty from "@/assets/c-panty.png";
import tee from "@/assets/c-tee.png";
import fabric from "@/assets/fabric.jpg";
import silkRibbon from "@/assets/silk-ribbon.jpg";

import { IntroLoader } from "@/components/brand/intro-loader";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ProductShowcaseSlider } from "@/components/showcase/product-showcase-slider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RIDOZ Style | Premium Innerwear & Loungewear" },
      {
        name: "description",
        content:
          "Seamless, breathable innerwear by RIDOZ. Bras, briefs, boxers, panties, vests and crew undershirts engineered for all-day comfort and confidence.",
      },
      { property: "og:title", content: "RIDOZ Style — Premium Innerwear & Loungewear" },
      {
        property: "og:description",
        content: "Seamless support, all-day comfort. Engineered for performance, made for every day.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/assets/brand/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RIDOZ Style | Premium Innerwear" },
      {
        name: "twitter:description",
        content: "Seamless support, all-day comfort. Engineered for performance, made for every day.",
      },
      { name: "twitter:image", content: "/assets/brand/og-image.png" },
    ],
  }),
  component: Index,
});

const PHONE = "+91 7510441075";
const TEL = `tel:${PHONE.replace(/\s/g, "")}`;
const WHATSAPP_NUMBER = PHONE.replace(/\D/g, "");
const WHATSAPP_ENQUIRY_MESSAGE =
  "Hi, I'm interested in your innerwear products. Could you please share details about sample availability, pricing, and the process for obtaining samples? Looking forward to hearing from you.";
const WHATSAPP_ENQUIRY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_ENQUIRY_MESSAGE)}`;
type P = { name: string; short: string; img: string; tag: string; sw: string };
const products: P[] = [
  { name: "Wine Trunk Boxer", short: "TRUNK", img: trunk, tag: "Men", sw: "var(--swatch-wine)" },
  { name: "Caramel Comfort Bra", short: "BRA", img: bra, tag: "Women", sw: "var(--swatch-sand)" },
  { name: "Navy Classic Brief", short: "BRIEF", img: brief, tag: "Men", sw: "var(--swatch-navy)" },
  { name: "Teal High-Waist Panty", short: "PANTY", img: panty, tag: "Women", sw: "var(--swatch-teal)" },
  { name: "Ribbed Cotton Vest", short: "VEST", img: vest, tag: "Men", sw: "var(--swatch-cloud)" },
  { name: "Classic Crew Undershirt", short: "CREW", img: tee, tag: "Men", sw: "var(--swatch-slate)" },
];
const reviews = [
  { t: "Comfort You Can Feel", q: "Soft fabric that stays comfortable from morning meetings to late nights.", n: "Anjali R." },
  { t: "Quality That Matters", q: "Stitching holds up wash after wash. The waistband never rolls.", n: "Rahul M." },
  { t: "Made for Everyday Wear", q: "Breathable, light and fits perfectly. I've ordered three more packs.", n: "Sneha K." },
];
const ease = [0.22, 1, 0.36, 1] as const;

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay, ease }}>
      {children}
    </motion.div>
  );
}

/** Headline whose words rise out of a mask, one after another. */
function SplitHeading({ lines, className = "" }: { lines: { text: string; className?: string }[]; className?: string }) {
  return (
    <motion.h2 className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
      {lines.map((l, li) => (
        <span key={li} className={l.className ?? ""}>
          {l.text.split(" ").map((w, wi) => (
            <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span className="inline-block" variants={{ hidden: { y: "105%" }, show: { y: 0, transition: { duration: 0.8, ease } } }}>
                {w}&nbsp;
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </motion.h2>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{children}</p>;
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gold" />;
}

function Header() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("menu");
  });
  const links = ["Drop", "Designs", "Shop", "Collections", "Reviews", "Contact"];
  const [activeSection, setActiveSection] = useState("Drop");

  useEffect(() => {
    const handleScroll = () => {
      // Check if near bottom of document for Contact
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 90
      ) {
        setActiveSection("Contact");
        return;
      }

      // Check sections from bottom to top so the lowest active section wins
      const threshold = 180;
      for (let i = links.length - 1; i >= 0; i--) {
        const link = links[i];
        const el = document.getElementById(link.toLowerCase());
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            setActiveSection(link);
            return;
          }
        }
      }
      setActiveSection("Drop");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, l: string) => {
    e.preventDefault();
    setActiveSection(l);
    const id = l.toLowerCase();
    const el = document.getElementById(id);
    if (el) {
      if (id === "designs") {
        window.scrollTo({
          top: el.offsetTop,
          behavior: "smooth",
        });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.history.pushState(null, "", `#${id}`);
    }
    setOpen(false);
  };
  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-border bg-background/80 px-5 py-2.5 shadow-sm backdrop-blur-xl">
        <a
          href="#drop"
          onClick={(e) => handleNavClick(e, "Drop")}
          aria-label="RIDOZ Style, back to top"
          className="group flex items-center gap-2.5"
        >
          <motion.span
            whileHover={{ scale: 1.05, rotate: [0, -3, 3, 0] }}
            transition={{ duration: 0.3 }}
            className="block shrink-0"
          >
            <BrandLogo variant="full" size="md" href={null} priority={true} />
          </motion.span>
          <span className="font-display text-3xl font-bold leading-none tracking-tight text-[#a51538]">
            RIDOZ
          </span>
        </a>
        <nav aria-label="Primary" className="hidden gap-8 text-sm font-medium md:flex">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={(e) => handleNavClick(e, l)}
              className="relative flex min-h-11 items-center"
            >
              <RandomLetterSwap
                className={`cursor-pointer text-sm font-medium transition-colors duration-200 ${
                  activeSection === l ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                label={l}
                staggerDuration={0.025}
                transition={{ duration: 0.6, type: "spring" }}
              />
              {activeSection === l && (
                <motion.span layoutId="active-nav-indicator" transition={{ type: "spring", stiffness: 380, damping: 30 }} className="absolute bottom-2.5 left-0 right-0 h-0.5 rounded-full bg-foreground" />
              )}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Magnet className="hidden sm:inline-flex" strength={0.25}>
            <a href={WHATSAPP_ENQUIRY_URL} target="_blank" rel="noopener noreferrer" className="btn-sweep inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:text-accent-foreground">Enquiry</a>
          </Magnet>
          <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full md:hidden">{open ? <X /> : <Menu />}</button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto mt-2 flex max-w-6xl flex-col rounded-3xl border border-border bg-card p-4 shadow-soft md:hidden"
          >
            <div className="flex flex-col gap-1 py-1">
              {links.map((l) => (
                <a
                  key={l}
                  onClick={(e) => handleNavClick(e, l)}
                  href={`#${l.toLowerCase()}`}
                  className={`flex min-h-11 items-center justify-between rounded-xl px-3 text-base transition-colors duration-200 ${
                    activeSection === l
                      ? "font-semibold text-foreground bg-accent/30"
                      : "font-medium text-muted-foreground hover:text-foreground active:text-foreground"
                  }`}
                >
                    <span>{l}</span>
                    {activeSection === l && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                </a>
              ))}
            </div>
            <a
              href={WHATSAPP_ENQUIRY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-sm transition-opacity active:opacity-90"
            >
              Enquiry
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const p = products[i] ?? products[0]!;
  const ref = useRef<HTMLElement>(null);
  const isInteracting = useRef(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 16 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!isInteracting.current) {
        setI((v) => (v + 1) % products.length);
      }
    }, 5500);
    return () => clearInterval(t);
  }, [i]);

  const move = (e: MouseEvent<HTMLElement>) => {
    if (isInteracting.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const handleTouchMove = (e: TouchEvent<HTMLElement>) => {
    if (isInteracting.current || !e.touches[0] || !ref.current) return;
    const t = e.touches[0];
    const r = ref.current.getBoundingClientRect();
    mx.set((t.clientX - r.left) / r.width - 0.5);
    my.set((t.clientY - r.top) / r.height - 0.5);
  };

  const handleTouchEnd = () => {
    if (!isInteracting.current) {
      mx.set(0);
      my.set(0);
    }
  };

  return (
    <section
      ref={ref}
      id="drop"
      onMouseMove={move}
      onMouseLeave={() => { if (!isInteracting.current) { mx.set(0); my.set(0); } }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex min-h-[100svh] items-center justify-center overflow-visible pt-20 pb-6 sm:pt-28 sm:pb-12 md:h-[100svh] md:max-h-[100svh] md:pt-28 lg:pt-32 md:pb-8"
    >
      <div className="grain absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-5 sm:gap-8 sm:px-8 md:px-14 lg:px-20 xl:px-24 md:grid-cols-[1.05fr_1.3fr_1.1fr] md:items-start md:gap-8 lg:gap-12 xl:gap-14">
        {/* Left Column: Headline & Action */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 flex flex-col justify-center pt-2 md:pt-5">
          <motion.h1 variants={rise} className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.94]">
            Comfort<br />meets<br /><em className="font-semibold text-primary">confidence.</em>
          </motion.h1>
          <div className="my-2.5 h-[2px] w-12 bg-primary/70 md:hidden" />
          <motion.p variants={rise} className="mt-2 md:mt-4 max-w-sm text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground">
            Seamless support, all-day comfort. Engineered for performance, made for every day.
          </motion.p>
          <motion.div variants={rise} className="mt-5 hidden md:block lg:mt-8">
            <Magnet strength={0.35}>
              <a
                href="#shop"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  window.history.pushState(null, "", "#shop");
                }}
                className="btn-sweep group inline-flex min-h-11 sm:min-h-12 items-center gap-2.5 rounded-full border border-primary px-6 text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary transition-colors duration-300 [--btn-sweep:var(--primary)] hover:text-primary-foreground shadow-xs"
              >
                Explore the drop <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
            </Magnet>
          </motion.div>
        </motion.div>

        {/* Center Column: Prominent Circle Backdrop + Interactive Wear Product */}
        <motion.div style={{ y: imgY, perspective: 1200 }} className="relative flex items-center justify-center will-change-transform py-4 md:py-0 self-center">
          {/* Circle backdrop - darker matching selection swatch, increased size */}
          <motion.div
            animate={{ backgroundColor: p.sw }}
            transition={{ duration: 1.1 }}
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[300px] sm:w-[380px] md:w-[420px] lg:w-[500px] xl:w-[560px] 2xl:w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden shadow-2xl md:shadow-none opacity-95 will-change-transform border border-white/40"
          >
            <motion.img
              key={p.img}
              initial={{ scale: 1.15, rotate: -3, opacity: 0 }}
              animate={{ scale: 1.05, rotate: 0, opacity: 0.18 }}
              transition={{ duration: 0.8 }}
              src={silkRibbon}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center mix-blend-multiply pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/15 pointer-events-none" />
          </motion.div>

          {/* Wear image with soft contact shadow: concentric inside circle */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="relative flex flex-col items-center justify-center">
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.25}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 22 }}
              whileDrag={{ scale: 1.05 }}
              onPointerDown={() => { isInteracting.current = true; }}
              onDragStart={() => { isInteracting.current = true; }}
              onDrag={(_, info) => {
                isInteracting.current = true;
                mx.set(Math.max(-0.6, Math.min(0.6, info.offset.x / 180)));
                my.set(Math.max(-0.6, Math.min(0.6, info.offset.y / 180)));
              }}
              onDragEnd={(_, info) => {
                isInteracting.current = false;
                mx.set(0);
                my.set(0);
                if (info.offset.x < -45 || info.velocity.x < -300) {
                  setI((v) => (v + 1) % products.length);
                } else if (info.offset.x > 45 || info.velocity.x > 300) {
                  setI((v) => (v - 1 + products.length) % products.length);
                }
              }}
              className="cursor-grab active:cursor-grabbing touch-pan-y select-none will-change-transform"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={p.img}
                  src={p.img}
                  alt={p.name}
                  width={800}
                  height={1000}
                  draggable={false}
                  decoding="async"
                  style={{ rotateX: rx, rotateY: ry }}
                  initial={{ opacity: 0, scale: 0.72, rotate: -16, y: 40 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, rotate: 12, y: -30 }}
                  transition={{ duration: 0.8, ease }}
                  className="drop-product pointer-events-none w-[195px] sm:w-[235px] md:w-[275px] lg:w-[325px] xl:w-[365px] 2xl:w-[395px] select-none will-change-transform drop-shadow-md"
                />
              </AnimatePresence>
            </motion.div>
            {/* Ground shadow beneath the wear item */}
            <motion.div
              animate={{ scale: [1, 0.92, 1], opacity: [0.35, 0.22, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none -mt-3 sm:-mt-4 h-4 sm:h-5 w-36 sm:w-48 rounded-full bg-black/30 blur-md"
            />
          </motion.div>
        </motion.div>

        {/* Right Column: Title, Swatches & Feature Cards */}
        <div className="relative z-10 flex flex-col items-start pt-2 md:pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease }}
              className="w-full"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-wider text-muted-foreground uppercase">{p.tag}</p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-foreground leading-tight">{p.name}</h2>
            </motion.div>
          </AnimatePresence>

          <div className="my-3 sm:my-4 h-px w-14 bg-foreground/20" />

          {/* Color Swatches */}
          <div className="flex items-center gap-2.5 sm:gap-3" role="group" aria-label="Choose product">
            {products.map((q, k) => (
              <Magnet key={q.name} strength={0.4}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  aria-label={q.name}
                  aria-pressed={k === i}
                  onClick={() => setI(k)}
                  style={{ backgroundColor: q.sw }}
                  className={`relative h-10 w-10 sm:h-11 sm:w-11 md:h-10 md:w-10 lg:h-12 lg:w-12 shrink-0 cursor-pointer overflow-hidden rounded-full p-1.5 transition-all duration-200 shadow-sm ${
                    k === i
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                      : "opacity-75 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  <img src={q.img} alt="" draggable={false} className="h-full w-full object-contain pointer-events-none" />
                </motion.button>
              </Magnet>
            ))}
          </div>

          {/* Mobile view: 3-column horizontal card as in reference design */}
          <div className="mt-4 w-full md:hidden">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-3 backdrop-blur-xs shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-border/60 text-center">
                <div className="flex flex-col items-center px-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-foreground">Ultra Soft Fabric</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">Feels gentle on skin</p>
                </div>
                <div className="flex flex-col items-center px-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wind className="h-4 w-4" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-foreground">Breathable All Day</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">Keeps you fresh</p>
                </div>
                <div className="flex flex-col items-center px-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Move className="h-4 w-4" />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-foreground">4-Way Stretch</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">Moves with you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop view: Stacked feature cards */}
          <div className="mt-6 hidden w-full max-w-sm flex-col gap-3 md:flex">
            <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background/60 p-3 sm:py-3 sm:px-3.5 backdrop-blur-xs shadow-xs transition hover:bg-background/80">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Ultra Soft Fabric</p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">Feels gentle on skin</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background/60 p-3 sm:py-3 sm:px-3.5 backdrop-blur-xs shadow-xs transition hover:bg-background/80">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wind className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">Breathable All Day</p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">Keeps you fresh</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-background/60 p-3 sm:py-3 sm:px-3.5 backdrop-blur-xs shadow-xs transition hover:bg-background/80">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Move className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground">4-Way Stretch</p>
                <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground">Moves with you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/** Ticker that drifts left and speeds up (or reverses) with scroll velocity. */
function Marquee() {
  const items = ["Welcome to RIDOZ", "Everyday Comfort", "Made for You", "Move Freely", "Seamless Support"];
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const smooth = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [0, 1000], [0, 5], { clamp: false });
  const x = useTransform(base, (v) => `${v}%`);
  const dir = useRef(1);
  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const cappedDelta = Math.min(delta, 64);
    const b = boost.get();
    if (b < 0) dir.current = -1;
    else if (b > 0) dir.current = 1;
    const speed = 1.6 * (cappedDelta / 1000);
    const move = dir.current * speed * (1 + Math.abs(b));
    base.set(wrap(-25, 0, base.get() - move));
  });
  return (
    <div aria-hidden className="bg-secondary py-3.5 text-secondary-foreground [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <motion.div style={{ x }} className="flex w-max whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.4em] sm:text-xs">
        {[0, 1, 2, 3].map((set) => (
          <div key={set} className="flex shrink-0 items-center">
            {items.map((t) => (
              <span key={t} className="flex items-center">
                <span>{t}</span>
                <span className="mx-10 h-1 w-1 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ProductCard({ p, i }: { p: P; i: number }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease }}
      whileHover="hover"
      className="group flex w-[68vw] max-w-[260px] shrink-0 snap-start flex-col sm:w-[44vw] lg:w-[calc((100%-5rem)/6)] lg:max-w-none"
    >
      <motion.div
        variants={{ hover: { y: -6 } }}
        transition={{ duration: 0.3, ease }}
        className="relative overflow-hidden rounded-[1.75rem] border border-border"
        style={{ backgroundColor: `color-mix(in oklab, ${p.sw} 22%, var(--card))` }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 transition duration-700 group-hover:scale-110"
          style={{ backgroundColor: p.sw }}
        />
        <span className="absolute left-3 top-3 z-10 rounded-full bg-background/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur">
          {p.tag}
        </span>
        <motion.img
          variants={{ hover: { scale: 1.08, rotate: -4 } }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          src={p.img}
          alt={p.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          width={800}
          height={1000}
          className="drop-product relative mx-auto aspect-[4/5] w-[78%] object-contain py-6 pointer-events-none select-none"
        />
      </motion.div>
      <div className="mt-4 px-1">
        <h3 className="min-w-0 truncate text-sm font-semibold">{p.name}</h3>
      </div>
    </motion.article>
  );
}

function Shop({
  filter: controlledFilter,
  onFilterChange,
}: {
  filter?: string;
  onFilterChange?: (f: string) => void;
} = {}) {
  const [internalFilter, setInternalFilter] = useState("All");
  const filter = controlledFilter !== undefined ? controlledFilter : internalFilter;
  const setFilter = onFilterChange || setInternalFilter;
  const list = products.filter((p) => filter === "All" || p.tag === filter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  useEffect(() => {
    if (scrollRef.current && scrollRef.current.scrollLeft > 0) {
      scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [filter]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftPos.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const onMouseUp = () => {
    isDown.current = false;
  };

  return (
    <section id="shop" className="mx-auto max-w-6xl px-5 py-12 sm:py-16 md:py-24 lg:py-28">
      <div className="grid grid-cols-1 items-end gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Eyebrow>The collection</Eyebrow>
          <SplitHeading className="mt-3 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl" lines={[{ text: "New" }, { text: "arrivals", className: "italic font-semibold text-primary" }]} />
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x" role="group" aria-label="Filter products">
          {["All", "Men", "Women"].map((f) => (
            <Magnet key={f} strength={0.3}>
              <motion.button whileTap={{ scale: 0.94 }} aria-pressed={filter === f} onClick={() => setFilter(f)} className="relative min-h-11 cursor-pointer shrink-0 rounded-full border border-border px-6 text-sm font-semibold transition-colors duration-200 hover:border-primary">
                {filter === f && <motion.span layoutId="filter-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-primary" />}
                <span className={`relative ${filter === f ? "text-primary-foreground" : ""}`}>{f}</span>
              </motion.button>
            </Magnet>
          ))}
        </div>
      </div>
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ WebkitOverflowScrolling: "touch" }}
        className="no-scrollbar -mx-5 mt-6 sm:mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 lg:mx-0 lg:px-0 cursor-grab active:cursor-grabbing touch-pan-x select-none overscroll-x-contain"
      >
        <AnimatePresence mode="sync">
          {list.map((p, k) => <ProductCard key={p.name} p={p} i={k} />)}
        </AnimatePresence>
      </div>
    </section>
  );
}

type Col = { t: string; s: string; n: string; items: string; tint: string; pics: { src: string; alt: string }[] };

/** Fanned stack of cut-out products; spreads on hover and follows the pointer in layers. */
function CollectionCard({ c, i, onSelect }: { c: Col; i: number; onSelect?: (category: string) => void }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 18 });
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 });
  const move = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const moveTouch = (e: TouchEvent<HTMLElement>) => {
    if (!e.touches[0]) return;
    const t = e.touches[0];
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((t.clientX - r.left) / r.width - 0.5);
    my.set((t.clientY - r.top) / r.height - 0.5);
  };
  const endTouch = () => {
    mx.set(0);
    my.set(0);
  };
  const mid = (c.pics.length - 1) / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect?.(c.t);
    const shopEl = document.getElementById("shop");
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "#shop");
    }
  };
  return (
    <motion.a
      href="#shop"
      onClick={handleClick}
      aria-label={`Shop ${c.t}'s collection`}
      onMouseMove={move}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      onTouchMove={moveTouch}
      onTouchEnd={endTouch}
      initial="rest"
      whileInView="show"
      whileHover="hover"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ rest: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0 }, hover: { opacity: 1, y: -6 } }}
      transition={{ duration: 0.8, delay: i * 0.15, ease }}
      className="group relative flex min-h-[340px] overflow-hidden rounded-[2rem] border border-border p-6 sm:min-h-[380px] sm:p-9"
      style={{ backgroundColor: `color-mix(in oklab, ${c.tint} 24%, var(--card))` }}
    >
      <motion.span
        aria-hidden
        variants={{ rest: { scale: 0.6, opacity: 0 }, show: { scale: 1, opacity: 1 }, hover: { scale: 1.08, opacity: 1 } }}
        transition={{ duration: 0.9, ease }}
        className="pointer-events-none absolute -right-4 sm:-right-8 md:-right-4 lg:-right-12 top-1/2 aspect-square w-[58%] sm:w-[64%] md:w-[54%] lg:w-[65%] -translate-y-1/2 rounded-full opacity-40"
        style={{ backgroundColor: c.tint }}
      />
      <div className="relative z-10 flex w-full max-w-[55%] sm:max-w-[52%] md:max-w-[48%] lg:max-w-[52%] flex-col justify-between">
        <div>
          <span className="font-display text-xl font-semibold text-primary [font-variant-numeric:lining-nums]">{c.n}</span>
          <p className="mt-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-[0.2em] text-muted-foreground leading-snug break-words">
            {c.items}
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{c.s}</p>
          <h3 className="mt-1 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-none">{c.t}</h3>
          <Magnet strength={0.4} className="mt-4 sm:mt-5">
            <span className="btn-sweep inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-4 sm:px-5 text-xs sm:text-sm font-semibold text-primary transition-colors duration-300 [--btn-sweep:var(--primary)] group-hover:text-primary-foreground">
              Shop {c.t} <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:rotate-45" />
            </span>
          </Magnet>
        </div>
      </div>
      <motion.div style={{ x: px, y: py }} className="pointer-events-none absolute inset-y-0 right-0 w-[54%] sm:w-[58%] md:w-[48%] lg:w-[56%]">
        {c.pics.map((pic, k) => {
          const o = k - mid;
          return (
            <motion.img
              key={pic.alt}
              src={pic.src}
              alt={pic.alt}
              loading="lazy"
              width={800}
              height={1000}
              variants={{
                rest: { opacity: 0, y: 50, rotate: 0, x: 0 },
                show: { opacity: 1, y: 0, rotate: o * 7, x: o * 18 },
                hover: { opacity: 1, y: -8, rotate: o * 12, x: o * 30 },
              }}
              transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.25 + k * 0.1 }}
              style={{ zIndex: 10 - Math.abs(Math.round(o * 2)) }}
              className="drop-product absolute left-1/2 top-1/2 w-[60%] sm:w-[58%] -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          );
        })}
      </motion.div>
    </motion.a>
  );
}

function Collections({ onSelectCollection }: { onSelectCollection?: (category: string) => void } = {}) {
  const cols: Col[] = [
    { t: "Men", s: "Comfort meets confidence", n: "01", items: "Trunks · Briefs · Vests · Tees", tint: "var(--swatch-wine)", pics: [{ src: brief, alt: "Navy classic brief" }, { src: trunk, alt: "Wine trunk boxer" }, { src: vest, alt: "Ribbed cotton vest" }, { src: tee, alt: "Classic crew undershirt" }] },
    { t: "Women", s: "Soft, seamless & breathable", n: "02", items: "Bras · Panties", tint: "var(--swatch-sand)", pics: [{ src: bra, alt: "Caramel comfort bra" }, { src: panty, alt: "Teal high-waist panty" }] },
  ];
  return (
    <section id="collections" className="mx-auto max-w-6xl px-5 pb-12 sm:pb-16 md:pb-24">
      <div className="mb-6 sm:mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Two worlds</Eyebrow>
          <SplitHeading className="mt-3 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl" lines={[{ text: "Shop by" }, { text: "collection", className: "italic font-semibold text-primary" }]} />
        </div>
        <Reveal><p className="max-w-xs text-sm leading-relaxed text-muted-foreground">Two worlds of everyday comfort — pick yours and never look back.</p></Reveal>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cols.map((c, i) => <CollectionCard key={c.t} c={c} i={i} onSelect={onSelectCollection} />)}
      </div>
    </section>
  );
}

function Feature() {
  const feats = [
    { i: Wind, t: "Breathable", d: "Micro-modal airflow" },
    { i: Feather, t: "Featherlight", d: "Barely-there feel" },
    { i: ShieldCheck, t: "Anti-roll band", d: "Stays in place" },
  ];
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-12, 12]);
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  return (
    <section ref={ref} className="mx-auto max-w-6xl px-5 pb-12 sm:pb-16 md:pb-24">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, ease }} className="relative overflow-hidden rounded-[2.5rem] bg-secondary text-secondary-foreground">
        <img src={fabric} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />
        <div className="relative grid items-center gap-6 sm:gap-8 p-6 sm:p-12 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            <motion.p variants={rise} className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Boxer Briefs</motion.p>
            <motion.h2 variants={rise} className="mt-3 font-display text-4xl font-bold leading-[0.95] sm:text-5xl">Comfort made for <em className="font-semibold text-accent">every move.</em></motion.h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {feats.map((f) => (
                <motion.div variants={rise} whileHover="hover" key={f.t} className="rounded-2xl border border-secondary-foreground/15 bg-background/10 p-4 backdrop-blur transition-colors duration-300 hover:bg-background/20">
                  <motion.span variants={{ hover: { rotate: [0, -12, 12, 0], scale: 1.1 } }} transition={{ duration: 0.5 }} className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground"><f.i aria-hidden className="h-5 w-5" /></motion.span>
                  <p className="mt-3 font-semibold">{f.t}</p>
                  <p className="text-sm opacity-80">{f.d}</p>
                </motion.div>
              ))}
            </div>
            <motion.div variants={rise} className="mt-7">
              <Magnet strength={0.35}>
                <a href="#shop" className="btn-sweep group inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-accent-foreground transition-colors duration-300 [--btn-sweep:var(--background)]">
                  Shop boxers <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
              </Magnet>
            </motion.div>
          </motion.div>

          <div className="relative mx-auto aspect-square w-full max-w-[360px]">
            <motion.div aria-hidden animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-accent/50" />
            <motion.div aria-hidden animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute inset-8 rounded-full border border-secondary-foreground/20" />
            <div aria-hidden className="absolute inset-14 rounded-full bg-primary/50 blur-2xl" />
            <motion.img style={{ rotate, y }} src={trunk} alt="Wine trunk boxer" loading="lazy" className="drop-product absolute inset-0 m-auto w-[68%]" />
            {[
              { l: "Micro-modal", c: "left-0 top-[14%]", d: 0 },
              { l: "Anti-roll band", c: "bottom-[12%] right-0", d: 1.2 },
            ].map((b) => (
              <motion.span key={b.l} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 + b.d * 0.3, type: "spring", stiffness: 260, damping: 16 }} className={`absolute ${b.c}`}>
                <motion.span animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, delay: b.d, repeat: Infinity, ease: "easeInOut" }} className="block rounded-full bg-background px-4 py-2 text-xs font-semibold text-foreground shadow-soft">{b.l}</motion.span>
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Reviews() {
  return (
    <section id="reviews" className="mx-auto max-w-6xl px-5 pb-12 sm:pb-18 md:pb-28">
      <Eyebrow>Loved by customers</Eyebrow>
      <SplitHeading className="mt-3 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl" lines={[{ text: "Real talk", className: "italic font-semibold text-primary" }]} />
      <Reveal className="mt-6 sm:mt-10 overflow-hidden rounded-[2rem] border border-border">
        <StaggerTestimonials testimonials={reviews.map((r) => ({ testimonial: r.q, by: `${r.n}, ${r.t}` }))} />
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-border">
      <motion.p aria-hidden initial={{ y: "35%", opacity: 0 }} whileInView={{ y: "10%", opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease }} className="pointer-events-none absolute inset-x-0 bottom-0 select-none whitespace-nowrap text-center font-display text-[26vw] font-bold leading-[0.75] tracking-tight text-muted">RIDOZ</motion.p>
      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 sm:gap-10 px-5 py-8 sm:py-12 md:py-14 md:grid-cols-3">
        <div className="text-sm">
          <BrandLogo variant="full" size="md" showWordmark={true} href="#drop" />
          <p className="mt-3 text-muted-foreground">
            Precision-engineered everyday luxury. Crafted with breathable micro-modal and combed cotton.
          </p>
          <div className="mt-4">
            <p className="font-semibold uppercase tracking-widest text-primary text-xs">Customer Concierge</p>
            <a href={TEL} className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />{PHONE}
            </a>
          </div>
          <div className="mt-4 flex gap-2">
            {[
              { I: Instagram, l: "Instagram" },
              { I: Facebook, l: "Facebook" },
              { I: Youtube, l: "YouTube" },
            ].map(({ I, l }) => (
              <Magnet key={l} strength={0.4}>
                <a
                  href="#contact"
                  onClick={(e) => e.preventDefault()}
                  aria-label={l}
                  className="btn-sweep flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/60 transition-colors duration-300 [--btn-sweep:var(--primary)] hover:text-primary-foreground"
                >
                  <I className="h-4 w-4" />
                </a>
              </Magnet>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-2 text-sm text-muted-foreground">
          {["Terms & Conditions", "Privacy Policy", "Returns & Exchanges", "Shipping & Delivery", "Contact Us", "Customer Care"].map((l) => (
            <a
              key={l}
              href="#contact"
              onClick={(e) => e.preventDefault()}
              className="flex min-h-11 items-center transition-colors duration-200 hover:text-foreground"
            >
              {l}
            </a>
          ))}
        </div>
        <div>
          <p className="font-semibold uppercase tracking-widest text-primary text-xs">Payment & Trust</p>
          <p className="mt-2 text-xs text-muted-foreground">100% Encrypted & Secure Checkout</p>
          <div className="mt-3 flex flex-wrap content-start gap-2">
            {["UPI", "VISA", "Mastercard", "RuPay", "COD"].map((p) => (
              <span key={p} className="rounded-md border border-border bg-background/50 px-2.5 py-1 text-xs font-semibold">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="relative z-10 py-5 text-center text-xs text-muted-foreground">© 2026 RIDOZ Style Innerwears. All rights reserved.</p>
    </footer>
  );
}

if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
}

function Index() {
  const [shopFilter, setShopFilter] = useState("All");

  // Always come to top on refresh or load
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    const onBeforeUnload = () => {
      window.scrollTo(0, 0);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("no_intro") === "1" || params.get("skip") === "1") return false;
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <MotionConfig reducedMotion="user">
      {loading && <IntroLoader key="ridoz-intro" onComplete={() => setLoading(false)} />}
      <ScrollProgress />
      <Header />
      <main className="overflow-x-clip">
        <Hero />
        <ProductShowcaseSlider />
        <Marquee />
        <Shop filter={shopFilter} onFilterChange={setShopFilter} />
        <Collections onSelectCollection={(cat) => setShopFilter(cat)} />
        <Feature />
        <Reviews />
      </main>
      <Footer />
    </MotionConfig>
  );
}
