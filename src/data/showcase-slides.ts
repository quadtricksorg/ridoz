import { productById } from "@/data/products";

export interface ShowcaseSlide {
  /** Unique slide identifier */
  id: string;
  /** Image asset (imported or URL path) */
  image: string;
  /** Giant uppercase word displayed behind the product in 3D parallax (e.g. "CARAMEL") */
  title: string;
  /** Full product display name */
  productName: string;
  /** One-line crisp description */
  shortDescription: string;
  /** Price display string */
  price: string;
  /** Dark plain background start/ambient color (derived from product color) */
  bgFrom: string;
  /** Dark plain background edge color (derived from product color) */
  bgTo: string;
  /** Representative color of the product (used for low-opacity flower animations and tones) */
  braColor: string;
  /** Dark tone derived from the product color, used for content card title, badge, and solid CTA button */
  darkColor: string;
  /** Accent highlight color for badges, button glows, and active states */
  accentColor: string;
  /** Button CTA text */
  ctaLabel?: string;
  /** Target link for CTA button */
  link?: string;
  /** Accessibility image alt text */
  alt?: string;
  /** Optional badge / tag (e.g. "Cloud Lift", "Second Skin") */
  tag?: string;
  /** Custom lightened background for small circular swatches so dark thumbnails remain clearly visible */
  swatchBg?: string;
  /**
   * Set to false if you add an image that does not have a transparent background.
   * When false, a soft-shadowed rounded frame is automatically applied as a fallback.
   * Default: true
   */
  isTransparent?: boolean;
}

export type ShowcaseProductType = "bra" | "boxer" | "panty" | "brief" | "vest";

export interface ShowcaseProductItem {
  id: ShowcaseProductType;
  name: string;
  label: string;
  tag: string;
  swatchBg: string;
  thumb: string;
  slides: ShowcaseSlide[];
}

/* ── Palette helpers: every tone is derived from the real fabric colour ── */
const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) =>
  "#" +
  rgb
    .map((v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const mix = (hex: string, target: string, t: number) => {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i]! - v) * t));
};
/** Perceived lightness 0..1 */
const lum = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return (0.2126 * r! + 0.7152 * g! + 0.0722 * b!) / 255;
};

function palette(hex: string) {
  const l = lum(hex);
  return {
    braColor: hex,
    bgFrom: mix(hex, "#000000", 0.8),
    bgTo: mix(hex, "#000000", 0.9),
    // dark enough for white button text / readable on the light info card
    darkColor: mix(hex, "#000000", l > 0.55 ? 0.6 : l > 0.3 ? 0.42 : 0.15),
    accentColor: mix(hex, "#ffffff", 0.22),
    swatchBg: mix(hex, "#ffffff", l < 0.2 ? 0.45 : 0.3),
  };
}

type SlideCopy = { title: string; tag: string; shortDescription: string; price: string } & Partial<
  Pick<ShowcaseSlide, "bgFrom" | "bgTo" | "darkColor" | "accentColor" | "swatchBg">
>;

/** White fabric would give a washed-out grey palette, so vests take the burgundy of their chest logo. */
const VEST_TONES = {
  bgFrom: "#2c171c",
  bgTo: "#1d0f13",
  darkColor: "#7d1430",
  accentColor: "#c4304f",
  swatchBg: "#ead7db",
} as const;

function slide(productId: string, copy: SlideCopy): ShowcaseSlide {
  const prod = productById(productId);
  return {
    id: productId,
    image: prod.image,
    productName: prod.name,
    alt: `${prod.name} in ${prod.colour.toLowerCase()}`,
    ctaLabel: "Shop This Look",
    link: "#shop",
    isTransparent: true,
    ...palette(prod.hex),
    ...copy,
  };
}

export const braSlides: ShowcaseSlide[] = [
  slide("bra-pink", {
    title: "BLUSH",
    tag: "Cloud Lift",
    price: "₹1,499",
    shortDescription: "Featherweight cups crafted for natural lift and zero pinch.",
  }),
  slide("bra-caramel", {
    title: "CARAMEL",
    tag: "Second Skin",
    price: "₹1,599",
    shortDescription: "Ultra-smooth moulded support, invisible under light fabrics.",
  }),
  slide("bra-olive", {
    title: "OLIVE",
    tag: "Natural Touch",
    price: "₹1,499",
    shortDescription: "Breathable soft weave with gentle, pressure-free support.",
  }),
  slide("bra-plum", {
    title: "PLUM",
    tag: "Silky Moulded",
    price: "₹1,549",
    shortDescription: "Silky microfibre with gentle side-smoothing contour wings.",
  }),
  slide("bra-rust", {
    title: "TERRA",
    tag: "Velvet Soft",
    price: "₹1,499",
    shortDescription: "Adaptive stretch cups that move seamlessly from dawn to dusk.",
  }),
];

export const boxerSlides: ShowcaseSlide[] = [
  slide("trunk-maroon", {
    title: "MAROON",
    tag: "Signature Cotton",
    price: "₹999",
    shortDescription: "Soft combed cotton with an anti-roll gold-trim waistband.",
  }),
  slide("trunk-grey", {
    title: "GRAPHITE",
    tag: "Everyday Fit",
    price: "₹999",
    shortDescription: "4-way breathable stretch with ergonomic everyday support.",
  }),
  slide("trunk-navy", {
    title: "NAVY",
    tag: "Aerofit Active",
    price: "₹999",
    shortDescription: "Deep navy stretch fibre with a silver-trim comfort band.",
  }),
  slide("trunk-brown", {
    title: "COCOA",
    tag: "Zero Friction",
    price: "₹1,049",
    shortDescription: "Ultra-soft weave with natural shape retention all day.",
  }),
  slide("trunk-rust", {
    title: "RUST",
    tag: "Second Skin",
    price: "₹1,049",
    shortDescription: "Warm rust tone with stay-put leg cuffs and a soft waistband.",
  }),
];

export const pantySlides: ShowcaseSlide[] = [
  slide("panty-orchid-mauve", {
    title: "MAUVE",
    tag: "Cloud Soft",
    price: "₹799",
    shortDescription: "Featherweight second-skin cotton in a soft orchid mauve.",
  }),
  slide("panty-deep-teal", {
    title: "TEAL",
    tag: "Second Skin",
    price: "₹799",
    shortDescription: "Breathable pure cotton crafted for breezy daily comfort.",
  }),
  slide("panty-rani-pink", {
    title: "RANI",
    tag: "Airy Soft",
    price: "₹799",
    shortDescription: "Bright rani pink stretch with a gentle elastic waistband.",
  }),
  slide("panty-cherry-red", {
    title: "CHERRY",
    tag: "Everyday Fit",
    price: "₹799",
    shortDescription: "Rich cherry red cotton with smooth, no-dig leg edges.",
  }),
  slide("panty-rose-clay", {
    title: "TERRA",
    tag: "Velvet Soft",
    price: "₹849",
    shortDescription: "Soft rose-clay cotton that moves with your body all day.",
  }),
];

export const briefSlides: ShowcaseSlide[] = [
  slide("brief-navy", {
    title: "NAVY",
    tag: "Essential Line",
    price: "₹899",
    shortDescription: "Deep navy body with a contrast sky-blue comfort waistband.",
  }),
  slide("brief-brown", {
    title: "CHOCOLATE",
    tag: "Luxury Cotton",
    price: "₹949",
    shortDescription: "Rich breathable weave crafted with a gentle elastic band.",
  }),
  slide("brief-blue", {
    title: "ROYAL",
    tag: "Freedom Cut",
    price: "₹899",
    shortDescription: "Royal blue cotton with a silver-trim branded waistband.",
  }),
  slide("brief-grey", {
    title: "STONE",
    tag: "Pure Comfort",
    price: "₹899",
    shortDescription: "Classic stone grey body with a contrast black-trim waistband.",
  }),
  slide("brief-maroon", {
    title: "MAROON",
    tag: "Cloud Lift",
    price: "₹949",
    shortDescription: "Rich maroon cotton with a tone-on-tone gold-trim waistband.",
  }),
];

export const vestSlides: ShowcaseSlide[] = [
  slide("vest-sleeveless", {
    title: "CLASSIC",
    tag: "Breathable Cotton",
    price: "₹499",
    shortDescription: "Sleeveless combed-cotton vest with a soft, deep scoop neck.",
    ...VEST_TONES,
  }),
  slide("vest-half-sleeve", {
    title: "CREW",
    tag: "Everyday Fit",
    price: "₹549",
    shortDescription: "Half-sleeve crew-neck vest that stays smooth under any shirt.",
    ...VEST_TONES,
  }),
];

export const showcaseProducts: ShowcaseProductItem[] = [
  {
    id: "bra",
    name: braSlides[0]!.productName,
    label: "Bra",
    tag: "Women",
    swatchBg: braSlides[0]!.swatchBg!,
    thumb: braSlides[0]!.image,
    slides: braSlides,
  },
  {
    id: "boxer",
    name: boxerSlides[0]!.productName,
    label: "Boxer",
    tag: "Men",
    swatchBg: boxerSlides[0]!.swatchBg!,
    thumb: boxerSlides[0]!.image,
    slides: boxerSlides,
  },
  {
    id: "panty",
    name: pantySlides[0]!.productName,
    label: "Panty",
    tag: "Women",
    swatchBg: pantySlides[0]!.swatchBg!,
    thumb: pantySlides[0]!.image,
    slides: pantySlides,
  },
  {
    id: "brief",
    name: briefSlides[0]!.productName,
    label: "Brief",
    tag: "Men",
    swatchBg: briefSlides[0]!.swatchBg!,
    thumb: briefSlides[0]!.image,
    slides: briefSlides,
  },
  {
    id: "vest",
    name: vestSlides[0]!.productName,
    label: "Vest",
    tag: "Men",
    swatchBg: vestSlides[0]!.swatchBg!,
    thumb: vestSlides[0]!.image,
    slides: vestSlides,
  },
];

export const showcaseProductsMap: Record<ShowcaseProductType, ShowcaseProductItem> = {
  bra: showcaseProducts[0]!,
  boxer: showcaseProducts[1]!,
  panty: showcaseProducts[2]!,
  brief: showcaseProducts[3]!,
  vest: showcaseProducts[4]!,
};

/** Default slides (Bra) for backwards compatibility and tests */
export const showcaseSlides: ShowcaseSlide[] = braSlides;
