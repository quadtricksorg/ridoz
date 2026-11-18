import { motion } from "framer-motion";
import {
  Anchor,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Store,
  Truck,
  Wind,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

/**
 * Clients — the premium client (Indian Navy, Kochi) and our local retail partners.
 *
 * Facts about the Navy are limited to well-established public information:
 * the Southern Naval Command is headquartered in Kochi, Kerala, and is the
 * Indian Navy's training command. No official emblems are used.
 *
 * Layout budget: on laptops / landscape tablets (the `wide` variant) the whole
 * section — heading plus both cards — fits in one screen below the fixed navbar,
 * down to ~1280×560 CSS px (e.g. a 1920×1080 display at 150% scaling).
 */

const ease = [0.22, 1, 0.36, 1] as const;

const NAVY_FACTS = [
  { icon: MapPin, label: "Headquarters", value: "Kochi, Kerala" },
  { icon: Shirt, label: "We supply", value: "Everyday innerwear for personnel" },
];

const DUTY_FEATURES = [
  { icon: Wind, label: "Breathable in humidity" },
  { icon: ShieldCheck, label: "Anti-roll waistband" },
  { icon: Truck, label: "On-time bulk supply" },
];

const RETAIL = [
  { icon: Store, title: "Innerwear stores", text: "Full size run, XS to XXL" },
  { icon: ShoppingBag, title: "Textile showrooms", text: "Family clothing & textile shops" },
  { icon: Shirt, title: "Men's & women's wear", text: "Paired with everyday fashion" },
];

/** Subtle wave lines for the navy card (pure SVG, no image request). */
function Waves({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 600 120" preserveAspectRatio="none" className={className}>
      {[0, 1, 2, 3].map((k) => (
        <path
          key={k}
          d={`M0 ${40 + k * 18} C 100 ${20 + k * 18}, 200 ${60 + k * 18}, 300 ${40 + k * 18} S 500 ${20 + k * 18}, 600 ${40 + k * 18}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity={0.5 - k * 0.1}
        />
      ))}
    </svg>
  );
}

export function ClientsSection({ partnerHref }: { partnerHref: string }) {
  return (
    <section id="clients" className="mx-auto max-w-6xl px-4 pb-14 sm:px-5 sm:pb-20 md:pb-24">
      {/* Heading, with the stockist CTA on the right (wraps below on phones) */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Trusted partners
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease }}
            className="mt-2 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-[2.75rem]"
          >
            Our <span className="font-semibold italic text-primary">clients</span>
          </motion.h2>
        </div>
        <a
          href={partnerHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Opens WhatsApp"
          className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition-colors duration-300 hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:outline-none"
        >
          <WhatsAppIcon className="h-[18px] w-[18px] shrink-0" />
          Become a stockist
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      <div className="grid gap-4 wide:grid-cols-[1.15fr_1fr]">
        {/* Premium client */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease }}
          className="relative isolate flex flex-col overflow-hidden rounded-[1.75rem] p-5 text-white shadow-[0_30px_60px_-30px_rgba(60,10,25,0.75)] sm:p-6"
          style={{
            background:
              "radial-gradient(120% 90% at 100% 0%, #8a2342 0%, transparent 55%), linear-gradient(150deg, #3a0c1b 0%, #5c1328 55%, #2a0812 100%)",
          }}
        >
          <Anchor
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-10 -right-10 -z-10 h-56 w-56 text-[#d9b46a] opacity-[0.12] sm:h-72 sm:w-72"
          />
          <Waves className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-20 w-full text-[#d9b46a]/40" />

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d9b46a]/50 bg-white/5 sm:h-14 sm:w-14">
              <Anchor className="h-6 w-6 text-[#f1d9a3] sm:h-7 sm:w-7" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9b46a]/60 bg-[#d9b46a]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f1d9a3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f1d9a3]" />
                Premium client
              </span>
              <h3 className="mt-1.5 font-display text-[1.75rem] font-bold leading-none sm:text-[2.1rem]">
                Indian Navy
              </h3>
              <p className="mt-1 text-[13px] font-medium tracking-wide text-[#f1d9a3] sm:text-sm">
                Southern Naval Command · Cochin
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
            The Indian Navy's training command, headquartered in Kochi. RIDOZ supplies innerwear
            made for long, demanding days in Kerala's coastal heat — breathable, stay-put and
            comfortable from first drill to last watch.
          </p>

          <dl className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {NAVY_FACTS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2"
              >
                <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#f1d9a3]/90">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold leading-snug">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3.5 sm:flex-row sm:flex-wrap sm:gap-x-5 wide:mt-auto">
            {DUTY_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] leading-snug text-white/85">
                <Icon className="h-4 w-4 shrink-0 text-[#f1d9a3]" strokeWidth={1.8} />
                {label}
              </li>
            ))}
          </ul>
        </motion.article>

        {/* Retail & wholesale partners */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.12, ease }}
          className="flex flex-col rounded-[1.75rem] border border-border p-5 sm:p-6"
          style={{ backgroundColor: "color-mix(in oklab, var(--swatch-sand) 18%, var(--card))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Retail &amp; Wholesale Partnerships
          </p>
          <h3 className="mt-1.5 font-display text-[1.65rem] font-bold leading-tight sm:text-[1.85rem]">
            Local shops, <span className="italic text-primary">everyday</span> trust
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Quality that keeps customers coming back.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-3 wide:mt-auto wide:grid-cols-1">
            {RETAIL.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-3.5 py-2.5 sm:flex-col sm:items-start wide:flex-row wide:items-center"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.article>
      </div>
    </section>
  );
}
