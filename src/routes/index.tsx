import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode, type MouseEvent } from "react";
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
import { Phone, Menu, X, ArrowUpRight, Instagram, Mail, MapPin, Wind, Feather, ShieldCheck } from "lucide-react";
import { Magnet } from "@/components/ui/magnetic";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { RandomLetterSwap } from "@/components/ui/random-letter-swap";
import { productById } from "@/data/products";
import { NewArrivals } from "@/components/new-arrivals/hanger-rail";
import { EveryBodyHero } from "@/components/hero/every-body-hero";
import { ClientsSection } from "@/components/clients/clients-section";
import { CTA_TO_RAIL, goToRail } from "@/lib/shop-links";
import fabric768 from "@/assets/fabric-768.webp";
import fabric1408 from "@/assets/fabric-1408.webp";

import { IntroLoader } from "@/components/brand/intro-loader";
import { BrandLogo, BrandWordmark } from "@/components/brand/brand-logo";
import { ProductShowcaseSlider } from "@/components/showcase/product-showcase-slider";
import { TrioBoxShowcase } from "@/components/showcase/trio-box-showcase";

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
const EMAIL = "sales@ridozstyle.com";
const INSTAGRAM_URL = "https://www.instagram.com/ridoz_style?utm_source=ig_web_button_share_sheet&obrf=ZDNlZDc0MzIxNw==";
const MAPS_URL = "https://maps.app.goo.gl/dF8pQshLZfj1kH2E6";
/** Gmail's web composer — what desktops open, and the fallback on phones. */
const GMAIL_WEB = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}`;

/** New email to RIDOZ in Gmail: the Gmail app on phones (web Gmail if it isn't installed), web Gmail on desktops. */
function openGmail(e: React.MouseEvent<HTMLAnchorElement>) {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    e.preventDefault();
    // "intent:" (no //) → Android builds a clean "mailto:address"; "intent://" would give "mailto://address".
    window.location.href = `intent:${EMAIL}#Intent;action=android.intent.action.SENDTO;scheme=mailto;package=com.google.android.gm;S.browser_fallback_url=${encodeURIComponent(GMAIL_WEB)};end`;
  } else if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    e.preventDefault();
    // Gmail app not installed → the page stays visible, so fall back to web Gmail.
    const fallback = setTimeout(() => {
      if (document.visibilityState === "visible") window.location.href = GMAIL_WEB;
    }, 1200);
    document.addEventListener("visibilitychange", () => clearTimeout(fallback), { once: true });
    window.location.href = `googlegmail:///co?to=${encodeURIComponent(EMAIL)}`;
  }
  // Desktops: the link itself opens web Gmail in a new tab.
}
const WHATSAPP_NUMBER = PHONE.replace(/\D/g, "");
const WHATSAPP_ENQUIRY_MESSAGE =
  "Hi, I'm interested in your innerwear products. Could you please share details.";
const WHATSAPP_ENQUIRY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_ENQUIRY_MESSAGE)}`;
const trunk = productById("trunk-maroon");
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

function Header({ intro = false }: { intro?: boolean }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("menu");
  });
  const links = ["Drop", "Designs", "Shop", "Clients", "Contact"];
  // Visible menu text; the keys above double as section ids (#drop, #designs, …).
  const navLabel = (l: string) => (l === "Drop" ? "Home" : l);
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
        if (!link) continue;
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
    // header-intro: drops in as the intro logo fades (CSS in styles.css)
    <header className={`fixed inset-x-0 top-4 z-50 px-4 ${intro ? "header-intro" : ""}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-[#a51538]/10 bg-gradient-to-r from-[#fdf5f2]/85 via-[#f9ebe7]/85 to-[#f5e1dc]/85 px-5 py-2.5 shadow-[0_8px_30px_-12px_rgba(120,30,50,0.25)] backdrop-blur-xl">
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
          <BrandWordmark priority decorative sizes="83px" className="h-6" />
        </a>
        <nav aria-label="Primary" className="hidden gap-5 text-sm font-medium md:flex lg:gap-8">
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
                label={navLabel(l)}
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
            <a href={WHATSAPP_ENQUIRY_URL} target="_blank" rel="noopener noreferrer" title="Opens WhatsApp" className="btn-sweep inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:text-accent-foreground">
              <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
              Chat with us
            </a>
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
                    <span>{navLabel(l)}</span>
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
              title="Opens WhatsApp"
              className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-sm transition-opacity active:opacity-90"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
              Chat with us
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
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
        <img src={fabric1408} srcSet={`${fabric768} 768w, ${fabric1408} 1408w`} sizes="(min-width: 1152px) 1112px, calc(100vw - 40px)" width={1408} height={912} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />
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
                <a href="#shop" onClick={(e) => goToRail(CTA_TO_RAIL.featureShopBoxers, e)} className="btn-sweep group inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-accent-foreground transition-colors duration-300 [--btn-sweep:var(--background)]">
                  Shop boxers <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
              </Magnet>
            </motion.div>
          </motion.div>

          <div className="relative mx-auto aspect-square w-full max-w-[360px]">
            <motion.div aria-hidden animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-dashed border-accent/50" />
            <motion.div aria-hidden animate={{ rotate: -360 }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }} className="absolute inset-8 rounded-full border border-secondary-foreground/20" />
            <div aria-hidden className="absolute inset-14 rounded-full bg-primary/50 blur-2xl" />
            <motion.img style={{ rotate, y }} src={trunk.image} srcSet={trunk.srcSet} sizes="245px" width={trunk.w} height={trunk.h} alt="Maroon trunk" loading="lazy" decoding="async" className="drop-product absolute inset-0 m-auto w-[68%]" />
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

/** Accepted payment methods as small inline marks (no image requests). */
function PaymentMark({ id }: { id: "upi" | "cod" }) {
  const label = { upi: "UPI", cod: "Cash on delivery" }[id];
  return (
    <li
      aria-label={label}
      title={label}
      className="flex h-11 min-w-[5.5rem] items-center justify-center rounded-xl border border-border bg-background/70 px-4 shadow-[0_6px_14px_-10px_rgba(90,30,50,0.35)]"
    >
      {id === "upi" && (
        <span aria-hidden className="flex items-center gap-0.5 text-[15px] font-black italic tracking-tight text-[#4b4b4f]">
          UPI
          <svg viewBox="0 0 12 14" className="h-3.5 w-3">
            <path d="M1 1 7 7 1 13Z" fill="#f47c20" />
            <path d="M5 1 11 7 5 13Z" fill="#138a36" />
          </svg>
        </span>
      )}
      {id === "cod" && (
        <span aria-hidden className="text-[15px] font-black italic tracking-tight text-foreground">
          COD
        </span>
      )}
    </li>
  );
}

function Footer() {
  const social = [
    { I: Instagram, l: "RIDOZ on Instagram", href: INSTAGRAM_URL },
    { I: Mail, l: `Email ${EMAIL} in Gmail`, href: GMAIL_WEB, onClick: openGmail },
    { I: WhatsAppIcon, l: "Chat with RIDOZ on WhatsApp", href: WHATSAPP_ENQUIRY_URL },
    { I: MapPin, l: "RIDOZ location on Google Maps", href: MAPS_URL },
  ];
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-border">
      <motion.p aria-hidden initial={{ y: "35%", opacity: 0 }} whileInView={{ y: "10%", opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease }} className="pointer-events-none absolute inset-x-0 bottom-0 select-none whitespace-nowrap text-center font-display text-[26vw] font-bold leading-[0.75] tracking-tight text-muted">RIDOZ</motion.p>

      <div className="ft-grid relative z-10 mx-auto max-w-6xl px-5 pb-6 pt-10 sm:pt-12 md:pt-14">
        {/* Brand */}
        <div className="ft-brand">
          <BrandLogo variant="full" size="md" showWordmark={true} href="#drop" priority={false} />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-foreground/80">
            Precision-engineered everyday luxury. Crafted with breathable micro-modal and combed cotton.
          </p>
        </div>

        {/* Social */}
        <div className="ft-social flex flex-wrap gap-3 xl:gap-2.5">
          {social.map(({ I, l, href, onClick }) => (
            <Magnet key={l} strength={0.4}>
              <a
                href={href}
                onClick={onClick}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l}
                title={l}
                className="btn-sweep flex h-12 w-12 xl:h-11 xl:w-11 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.07] text-foreground transition-colors duration-300 [--btn-sweep:var(--primary)] hover:text-primary-foreground"
              >
                <I className="h-5 w-5" />
              </a>
            </Magnet>
          ))}
        </div>

        {/* Customer care */}
        <div className="ft-care">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Customer Concierge</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href={TEL} className="group flex min-h-11 items-center gap-3 font-semibold transition-colors hover:text-primary">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-foreground transition-colors group-hover:text-primary">
                  <Phone className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px]">{PHONE}</span>
              </a>
            </li>
            <li>
              <a href={GMAIL_WEB} onClick={openGmail} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 items-center gap-3 font-semibold transition-colors hover:text-primary">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-foreground transition-colors group-hover:text-primary">
                  <Mail className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 text-[14px] xl:text-[13px]">
                  {EMAIL.split("@")[0]}
                  <wbr />@{EMAIL.split("@")[1]}
                </span>
              </a>
            </li>
          </ul>
        </div>

        {/* Payment & trust */}
        <div className="ft-pay">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Payment & Trust</p>
          <p className="mt-2 text-sm text-muted-foreground">100% Encrypted & Secure Checkout</p>
          <ul aria-label="Accepted payment methods" className="mt-4 flex flex-wrap gap-2.5">
            {(["upi", "cod"] as const).map((id) => (
              <PaymentMark key={id} id={id} />
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5">
        <p className="border-t border-border py-5 text-center text-xs text-muted-foreground sm:text-sm">© 2026 RIDOZ Style Innerwears. All rights reserved.</p>
      </div>
    </footer>
  );
}

if (typeof window !== "undefined") {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
}

function Index() {

  // Always come to top on refresh or load
  // Always start at the top on load / refresh (scroll restoration is "manual" above).
  // No "beforeunload" reset: phones fire it for tel:, mailto: and app links too, which
  // threw the visitor back to the top while the page stayed open.
  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Fixed for the page's lifetime, so the entrance isn't cut short when the intro unmounts.
  const [intro] = useState(loading);

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
      <Header intro={intro} />
      <main className="overflow-x-clip">
        <EveryBodyHero intro={intro} />
        <ProductShowcaseSlider />
        <TrioBoxShowcase />
        <Marquee />
        <NewArrivals />
        <Feature />
        <Reviews />
        <ClientsSection partnerHref={WHATSAPP_ENQUIRY_URL} />
      </main>
      <Footer />
    </MotionConfig>
  );
}
