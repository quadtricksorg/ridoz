import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";

import { RAIL_PRODUCTS, productById, type ProductCategory } from "@/data/products";
import { showcaseProducts } from "@/data/showcase-slides";

/**
 * Shop links — one place that connects every "shop" call-to-action on the page to
 * the right garment on the "Shop by collection" hanger rail (section #shop).
 *
 *   goToRail(LOOK_TO_RAIL["bra-pink"].target)   // "Shop this look" on the colour slider
 *   goToRail(CTA_TO_RAIL.trioExplore)           // "Explore the collection" → Panties
 *   goToRail(CTA_TO_RAIL.featureShopBoxers)     // "Shop boxers" → Trunks
 *
 * Rail indexes are resolved once here, so a click is an O(1) lookup + one event.
 */

export type RailTarget =
  { kind: "product"; productId: string } | { kind: "category"; category: ProductCategory };

const RAIL_INDEX = new Map(RAIL_PRODUCTS.map((p, i) => [p.id, i]));
const FIRST_IN_CATEGORY = new Map<ProductCategory, number>();
RAIL_PRODUCTS.forEach((p, i) => {
  if (!FIRST_IN_CATEGORY.has(p.category)) FIRST_IN_CATEGORY.set(p.category, i);
});

/** Rail position of a target (-1 if it is not on the rail). */
export function railIndexOf(t: RailTarget): number {
  return t.kind === "product"
    ? (RAIL_INDEX.get(t.productId) ?? -1)
    : (FIRST_IN_CATEGORY.get(t.category) ?? -1);
}

/* ── Colour slider "Shop this look" → the same garment on the rail ────────── */

export type LookLink = {
  slideId: string;
  /** The garment hanging on the rail. */
  railProductId: string;
  railIndex: number;
  /** The slider photo and the rail photo — the same file, so the look matches exactly. */
  slideImage: string;
  railImage: string;
  name: string;
  colour: string;
  target: RailTarget;
};

/**
 * Slide id → rail garment. Every slide is built from a catalogue product
 * (src/data/showcase-slides.ts), so each look maps to that product.
 */
export const LOOK_TO_RAIL: Record<string, LookLink> = Object.fromEntries(
  showcaseProducts.flatMap((group) =>
    group.slides.map((s) => {
      const p = productById(s.id);
      const link: LookLink = {
        slideId: s.id,
        railProductId: p.id,
        railIndex: RAIL_INDEX.get(p.id) ?? -1,
        slideImage: s.image,
        railImage: p.image,
        name: p.name,
        colour: p.colour,
        target: { kind: "product", productId: p.id },
      };
      return [s.id, link] as const;
    }),
  ),
);

if (import.meta.env.DEV) {
  for (const l of Object.values(LOOK_TO_RAIL)) {
    if (l.railIndex < 0) console.warn(`[shop-links] look "${l.slideId}" is not on the rail`);
    else if (l.slideImage !== l.railImage)
      console.warn(`[shop-links] look "${l.slideId}" shows a different photo than the rail`);
  }
}

/* ── Other call-to-actions ────────────────────────────────────────────────── */

export const CTA_TO_RAIL = {
  /** 3-Piece Box (panties window box) → "Explore the collection" */
  trioExplore: { kind: "category", category: "panty" },
  /** Feature section → "Shop boxers" */
  featureShopBoxers: { kind: "category", category: "trunk" },
} as const satisfies Record<string, RailTarget>;

/* ── Navigation ───────────────────────────────────────────────────────────── */

const EVENT = "ridoz:rail-goto";
export const SHOP_SECTION_ID = "shop";

/**
 * Bring a garment to the front of the rail and scroll to the shop section.
 * Use as an onClick of an `<a href="#shop">` (the href keeps it working without JS).
 */
export function goToRail(target: RailTarget, e?: MouseEvent) {
  const index = railIndexOf(target);
  const section = document.getElementById(SHOP_SECTION_ID);
  if (!section || index < 0) return; // let the plain #shop link do its job
  e?.preventDefault();
  e?.stopPropagation();
  window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: index }));
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  if (window.location.hash !== `#${SHOP_SECTION_ID}`)
    window.history.pushState(null, "", `#${SHOP_SECTION_ID}`);
}

/** The rail subscribes here; `onGoto` receives the rail index to show. */
export function useRailGoto(onGoto: (index: number) => void) {
  const cb = useRef(onGoto);
  cb.current = onGoto;
  useEffect(() => {
    const handler = (e: Event) => cb.current((e as CustomEvent<number>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
}
