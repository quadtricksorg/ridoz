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

/**
 * Clients — the premium client (Indian Navy, Kochi) and our local retail partners.
 *
 * Facts about the Navy are limited to well-established public information:
 * the Southern Naval Command is headquartered in Kochi, Kerala, and is the
 * Indian Navy's training command. No official emblems are used.
 */

const ease = [0.22, 1, 0.36, 1] as const;

const NAVY_FACTS = [
  { icon: MapPin, label: "Headquarters", value: "Kochi, Kerala" },
  { icon: Shirt, label: "We supply", value: "Everyday innerwear for personnel" },
];

const DUTY_FEATURES = [
  { icon: Wind, label: "Breathable in coastal humidity" },
  { icon: ShieldCheck, label: "Anti-roll waistband for long duty hours" },
  { icon: Truck, label: "Consistent, on-time bulk supply" },
];

const RETAIL = [
  {
    icon: Store,
    title: "Innerwear stores",
    text: "Neighbourhood specialists stocking our full size run, XS to XXL.",
  },
  {
    icon: ShoppingBag,
    title: "Textile showrooms",
    text: "Family clothing and textile shops carrying RIDOZ basics.",
  },
  {
    icon: Shirt,
    title: "Men's & women's wear",
    text: "Boutiques pairing RIDOZ innerwear with everyday fashion.",
  },
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
    <section id="clients" className="mx-auto max-w-6xl px-5 pb-14 sm:pb-20 md:pb-28">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Trusted partners
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease }}
            className="mt-3 whitespace-nowrap font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl"
          >
            Our <span className="font-semibold italic text-primary">clients</span>
          </motion.h2>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          From the Indian Navy in Kochi to the shops in your neighbourhood — RIDOZ is chosen where
          comfort has to hold up every single day.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        {/* Premium client */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease }}
          className="relative isolate overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_30px_60px_-30px_rgba(60,10,25,0.75)] sm:p-9"
          style={{
            background:
              "radial-gradient(120% 90% at 100% 0%, #8a2342 0%, transparent 55%), linear-gradient(150deg, #3a0c1b 0%, #5c1328 55%, #2a0812 100%)",
          }}
        >
          <Anchor
            aria-hidden
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-10 -right-10 -z-10 h-64 w-64 text-[#d9b46a] opacity-[0.12] sm:h-80 sm:w-80"
          />
          <Waves className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 w-full text-[#d9b46a]/40" />

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9b46a]/60 bg-[#d9b46a]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f1d9a3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f1d9a3]" />
              Premium client
            </span>
          </div>

          <div className="mt-6 flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d9b46a]/50 bg-white/5 sm:h-16 sm:w-16">
              <Anchor className="h-7 w-7 text-[#f1d9a3] sm:h-8 sm:w-8" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-3xl font-bold leading-none sm:text-4xl lg:text-5xl">
                Indian Navy
              </h3>
              <p className="mt-2 text-sm font-medium tracking-wide text-[#f1d9a3] sm:text-base">
                Southern Naval Command · Cochin
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
            Headquartered in Kochi, the Southern Naval Command is the Indian Navy's training
            command, where sailors and officers train through long, demanding days in Kerala's
            coastal heat. RIDOZ is proud to supply innerwear made for that routine — breathable,
            stay-put and comfortable from first drill to last watch.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {NAVY_FACTS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
              >
                <dt className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#f1d9a3]/90">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold leading-snug">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap sm:gap-x-6">
            {DUTY_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-white/85">
                <Icon className="h-4 w-4 shrink-0 text-[#f1d9a3]" strokeWidth={1.8} />
                {label}
              </li>
            ))}
          </ul>
        </motion.article>

        {/* Local retail partners */}
        <motion.article
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.12, ease }}
          className="flex flex-col rounded-[2rem] border border-border p-6 sm:p-9"
          style={{ backgroundColor: "color-mix(in oklab, var(--swatch-sand) 18%, var(--card))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Retail partners
          </p>
          <h3 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Local shops, <span className="italic text-primary">everyday</span> trust
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Neighbourhood stores stock RIDOZ because their customers come back for it — honest
            fabric, true sizing and colours that last wash after wash.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {RETAIL.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease }}
                className={`rounded-2xl border border-border bg-background/70 p-4 ${i === RETAIL.length - 1 ? "sm:col-span-2" : ""}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{text}</p>
              </motion.li>
            ))}
          </ul>

          <a
            href={partnerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-primary px-5 text-sm font-semibold text-primary transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
          >
            Become a stockist
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </motion.article>
      </div>
    </section>
  );
}
