import bra1 from "@/assets/showcase/generated/bra-1.webp";
import bra2 from "@/assets/showcase/generated/bra-2.webp";
import bra3 from "@/assets/showcase/generated/bra-3.webp";
import bra4 from "@/assets/showcase/generated/bra-4.webp";
import bra5 from "@/assets/showcase/generated/bra-5.webp";

import boxer1 from "@/assets/showcase/generated/boxer-1.webp";
import boxer2 from "@/assets/showcase/generated/boxer-2.webp";
import boxer3 from "@/assets/showcase/generated/boxer-3.webp";
import boxer4 from "@/assets/showcase/generated/boxer-4.webp";
import boxer5 from "@/assets/showcase/generated/boxer-5.webp";

import panty1 from "@/assets/showcase/generated/panty-1.webp";
import panty2 from "@/assets/showcase/generated/panty-2.webp";
import panty3 from "@/assets/showcase/generated/panty-3.webp";
import panty4 from "@/assets/showcase/generated/panty-4.webp";
import panty5 from "@/assets/showcase/generated/panty-5.webp";

import brief1 from "@/assets/showcase/generated/brief-1.webp";
import brief2 from "@/assets/showcase/generated/brief-2.webp";
import brief3 from "@/assets/showcase/generated/brief-3.webp";
import brief4 from "@/assets/showcase/generated/brief-4.webp";
import brief5 from "@/assets/showcase/generated/brief-5.webp";

import thumbBra from "@/assets/showcase/generated/thumb-bra.webp";
import thumbBoxer from "@/assets/showcase/generated/thumb-boxer.webp";
import thumbPanty from "@/assets/showcase/generated/thumb-panty.webp";
import thumbBrief from "@/assets/showcase/generated/thumb-brief.webp";

export interface ShowcaseSlide {
  /** Unique slide identifier */
  id: string;
  /** Image asset (imported or URL path) */
  image: string;
  /** Giant uppercase word displayed behind the product in 3D parallax (e.g. "LAVENDER") */
  title: string;
  /** Full product display name */
  productName: string;
  /** One-line crisp description */
  shortDescription: string;
  /** Price display string */
  price: string;
  /** Dark plain background start/ambient color (derived from bra/product color) */
  bgFrom: string;
  /** Dark plain background edge color (derived from bra/product color) */
  bgTo: string;
  /** Exact sampled color of the product (used for low-opacity flower animations and tones) */
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
  /**
   * Set to false if you add an image that does not have a transparent background.
   * When false, a soft-shadowed rounded frame is automatically applied as a fallback.
   * Default: true
   */
  isTransparent?: boolean;
}

export type ShowcaseProductType = "bra" | "boxer" | "panty" | "brief";

export interface ShowcaseProductItem {
  id: ShowcaseProductType;
  name: string;
  label: string;
  tag: string;
  swatchBg: string;
  thumb: string;
  slides: ShowcaseSlide[];
}

export const braSlides: ShowcaseSlide[] = [
  {
    id: "bra-1",
    image: bra1,
    title: "LAVENDER",
    productName: "Lilac Cloud Wirefree Bra",
    shortDescription: "Featherweight cups crafted for natural lift and zero pinch.",
    price: "₹1,499",
    bgFrom: "#1c1322",
    bgTo: "#100a14",
    braColor: "#b8a3c5",
    darkColor: "#4a2560",
    accentColor: "#c6b2d4",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Lilac Cloud Wirefree Bra in soft lavender microfiber",
    tag: "Cloud Lift",
    isTransparent: true,
  },
  {
    id: "bra-2",
    image: bra2,
    title: "VANILLA",
    productName: "Champagne Bare Contour Bra",
    shortDescription: "Ultra-smooth molded support, invisible under light fabrics.",
    price: "₹1,599",
    bgFrom: "#1d1711",
    bgTo: "#110d09",
    braColor: "#deceb8",
    darkColor: "#593e22",
    accentColor: "#e2d4c0",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Champagne Bare Contour Bra in seamless nude tone",
    tag: "Second Skin",
    isTransparent: true,
  },
  {
    id: "bra-3",
    image: bra3,
    title: "EUCALYPTUS",
    productName: "Sage Whisper Wireless Bra",
    shortDescription: "Breathable modal weave with gentle, pressure-free support.",
    price: "₹1,499",
    bgFrom: "#101c14",
    bgTo: "#09110b",
    braColor: "#afcbb5",
    darkColor: "#1d4429",
    accentColor: "#b8d2be",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Sage Whisper Wireless Bra in calming eucalyptus mint",
    tag: "Natural Touch",
    isTransparent: true,
  },
  {
    id: "bra-4",
    image: bra4,
    title: "AZURE",
    productName: "Powder Sky Seamless Balconette",
    shortDescription: "Silky microfiber with gentle side-smoothing contour wings.",
    price: "₹1,549",
    bgFrom: "#101924",
    bgTo: "#080e15",
    braColor: "#aac3da",
    darkColor: "#183659",
    accentColor: "#b5cce0",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Powder Sky Seamless Balconette in airy powder blue",
    tag: "Silky Molded",
    isTransparent: true,
  },
  {
    id: "bra-5",
    image: bra5,
    title: "TERRA",
    productName: "Rose Clay Comfort Contour Bra",
    shortDescription: "Adaptive stretch cups that move seamlessly from dawn to dusk.",
    price: "₹1,499",
    bgFrom: "#24130c",
    bgTo: "#140905",
    braColor: "#eba884",
    darkColor: "#861c31",
    accentColor: "#f0b596",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Rose Clay Comfort Contour Bra in rich blush terracotta",
    tag: "Velvet Soft",
    isTransparent: true,
  },
];

export const boxerSlides: ShowcaseSlide[] = [
  {
    id: "boxer-1",
    image: boxer1,
    title: "BURGUNDY",
    productName: "Burgundy Velvet Flex Boxer",
    shortDescription: "Featherweight modal weave with anti-roll contour waistband.",
    price: "₹999",
    bgFrom: "#22090e",
    bgTo: "#120407",
    braColor: "#651C2D",
    darkColor: "#521422",
    accentColor: "#87273c",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Burgundy Velvet Flex Boxer in rich burgundy maroon",
    tag: "Signature Modal",
    isTransparent: true,
  },
  {
    id: "boxer-2",
    image: boxer2,
    title: "FOREST GREEN",
    productName: "Dark Forest Green Boxer",
    shortDescription: "4-way breathable stretch with ergonomic athletic support.",
    price: "₹1,099",
    bgFrom: "#0e140c",
    bgTo: "#070a06",
    braColor: "#2B3326",
    darkColor: "#1d2419",
    accentColor: "#45523d",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Dark Forest Green Boxer in organic deep green",
    tag: "Aerofit Active",
    isTransparent: true,
  },
  {
    id: "boxer-3",
    image: boxer3,
    title: "NAVY BLUE",
    productName: "Navy Blue Ergonomic Trunk",
    shortDescription: "Deep navy 4-way stretch fiber with ergonomic athletic support.",
    price: "₹999",
    bgFrom: "#0a121c",
    bgTo: "#04080e",
    braColor: "#1B2F4D",
    darkColor: "#0E1E32",
    accentColor: "#2C4872",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Navy Blue Ergonomic Trunk in deep midnight navy",
    tag: "Aerofit Active",
    isTransparent: true,
  },
  {
    id: "boxer-4",
    image: boxer4,
    title: "CHOCOLATE",
    productName: "Chocolate Brown Contour Boxer",
    shortDescription: "Ultra-soft micro-rib weave with natural shape retention.",
    price: "₹1,049",
    bgFrom: "#1a100a",
    bgTo: "#0d0805",
    braColor: "#7A4F35",
    darkColor: "#4a2c1b",
    accentColor: "#9c6849",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Chocolate Brown Contour Boxer in warm chocolate tone",
    tag: "Zero Friction",
    isTransparent: true,
  },
  {
    id: "boxer-5",
    image: boxer5,
    title: "ONYX BLACK",
    productName: "Stealth Black Everyday Trunk",
    shortDescription: "Silky breathable combed modal with stay-put contour leg cuffs.",
    price: "₹999",
    bgFrom: "#0e0e0e",
    bgTo: "#060606",
    braColor: "#232323",
    darkColor: "#141414",
    accentColor: "#444444",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Stealth Black Everyday Trunk in sleek jet black",
    tag: "Second Skin",
    isTransparent: true,
  },
];

export const pantySlides: ShowcaseSlide[] = [
  {
    id: "panty-1",
    image: panty1,
    title: "LAVENDER",
    productName: "Lilac Cloud Seamless Panty",
    shortDescription: "Featherweight second-skin stretch in dreamy soft lavender.",
    price: "₹799",
    bgFrom: "#1c1322",
    bgTo: "#100a14",
    braColor: "#b8a3c5",
    darkColor: "#4a2560",
    accentColor: "#c6b2d4",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Lilac Cloud Seamless Panty in soft lavender microfiber",
    tag: "Cloud Lift",
    isTransparent: true,
  },
  {
    id: "panty-2",
    image: panty2,
    title: "SAGE",
    productName: "Sage Breeze Whisper Hipster",
    shortDescription: "Ultra-soft botanical sage fiber crafted for breezy daily comfort.",
    price: "₹849",
    bgFrom: "#101c13",
    bgTo: "#08100a",
    braColor: "#8da892",
    darkColor: "#1d3b24",
    accentColor: "#a3bda7",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Sage Breeze Whisper Hipster in botanical sage green",
    tag: "Second Skin",
    isTransparent: true,
  },
  {
    id: "panty-3",
    image: panty3,
    title: "PEACH",
    productName: "Barely Blush Cheeky Panty",
    shortDescription: "Delicate blush peach stretch with laser-cut no-show edges.",
    price: "₹799",
    bgFrom: "#241611",
    bgTo: "#140b08",
    braColor: "#ecc1ab",
    darkColor: "#7c3d22",
    accentColor: "#f2cca0",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Barely Blush Cheeky Panty in gentle pale peach",
    tag: "Airy Soft",
    isTransparent: true,
  },
  {
    id: "panty-4",
    image: panty4,
    title: "VANILLA",
    productName: "Buttercream High-Waist Panty",
    shortDescription: "Silky warm buttercream fiber with gentle tummy smoothing contour.",
    price: "₹849",
    bgFrom: "#211e13",
    bgTo: "#121008",
    braColor: "#d8caa0",
    darkColor: "#52461e",
    accentColor: "#e5d8b3",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Buttercream High-Waist Panty in warm vanilla cream",
    tag: "Silky Molded",
    isTransparent: true,
  },
  {
    id: "panty-5",
    image: panty5,
    title: "TERRA",
    productName: "Rose Clay Comfort Hipster",
    shortDescription: "Adaptive stretch cups that move seamlessly with your body all day.",
    price: "₹899",
    bgFrom: "#24130c",
    bgTo: "#140905",
    braColor: "#eba884",
    darkColor: "#861c31",
    accentColor: "#f0b596",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Rose Clay Comfort Hipster in rich blush terracotta",
    tag: "Velvet Soft",
    isTransparent: true,
  },
];

export const briefSlides: ShowcaseSlide[] = [
  {
    id: "brief-1",
    image: brief1,
    title: "STEALTH BLACK",
    productName: "Stealth Black Classic Brief",
    shortDescription: "Jet black premium combed cotton with breathable support pouch.",
    price: "₹899",
    bgFrom: "#0e0e0e",
    bgTo: "#060606",
    braColor: "#232323",
    darkColor: "#141414",
    accentColor: "#444444",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Stealth Black Classic Brief in sleek jet black",
    tag: "Essential Line",
    isTransparent: true,
  },
  {
    id: "brief-2",
    image: brief2,
    title: "CHOCOLATE",
    productName: "Dark Chocolate Tailored Brief",
    shortDescription: "Rich breathable micro-weave crafted with gentle elastic band.",
    price: "₹949",
    bgFrom: "#170e0a",
    bgTo: "#0a0604",
    braColor: "#402B1F",
    darkColor: "#2b1c14",
    accentColor: "#664531",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Dark Chocolate Tailored Brief in dark chocolate brown",
    tag: "Luxury Modal",
    isTransparent: true,
  },
  {
    id: "brief-3",
    image: brief3,
    title: "DEEP NAVY",
    productName: "Deep Navy Ergonomic Brief",
    shortDescription: "Deep navy body with contrast sky-blue comfort elastic waistband.",
    price: "₹899",
    bgFrom: "#0a121c",
    bgTo: "#04080e",
    braColor: "#1B2F4D",
    darkColor: "#0E1E32",
    accentColor: "#2C4872",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Deep Navy Ergonomic Brief in deep navy with sky blue waistband",
    tag: "Freedom Cut",
    isTransparent: true,
  },
  {
    id: "brief-4",
    image: brief4,
    title: "STONE GREY",
    productName: "Stone Grey Contrast Brief",
    shortDescription: "Classic stone grey body with dark stone grey comfort elastic waistband.",
    price: "₹899",
    bgFrom: "#141416",
    bgTo: "#09090a",
    braColor: "#65676B",
    darkColor: "#2e3034",
    accentColor: "#87898d",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Stone Grey Contrast Brief with dark stone grey elastic strap",
    tag: "Pure Comfort",
    isTransparent: true,
  },
  {
    id: "brief-5",
    image: brief5,
    title: "BURGUNDY",
    productName: "Burgundy Pop Waistband Brief",
    shortDescription: "Rich burgundy modal blend with tone-on-tone dark burgundy waistband.",
    price: "₹949",
    bgFrom: "#22090e",
    bgTo: "#120407",
    braColor: "#651C2D",
    darkColor: "#521422",
    accentColor: "#7a1f33",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Burgundy Brief with dark burgundy elastic strap",
    tag: "Cloud Lift",
    isTransparent: true,
  },
];

export const showcaseProducts: ShowcaseProductItem[] = [
  {
    id: "bra",
    name: "Lilac Cloud Wirefree Bra",
    label: "Bra",
    tag: "Women",
    swatchBg: "#b8a3c5",
    thumb: thumbBra,
    slides: braSlides,
  },
  {
    id: "boxer",
    name: "Burgundy Velvet Flex Boxer",
    label: "Boxer",
    tag: "Men",
    swatchBg: "#651C2D",
    thumb: thumbBoxer,
    slides: boxerSlides,
  },
  {
    id: "panty",
    name: "Lilac Cloud Seamless Panty",
    label: "Panty",
    tag: "Women",
    swatchBg: "#b8a3c5",
    thumb: thumbPanty,
    slides: pantySlides,
  },
  {
    id: "brief",
    name: "Stealth Black Classic Brief",
    label: "Brief",
    tag: "Men",
    swatchBg: "#232323",
    thumb: thumbBrief,
    slides: briefSlides,
  },
];

export const showcaseProductsMap: Record<ShowcaseProductType, ShowcaseProductItem> = {
  bra: showcaseProducts[0]!,
  boxer: showcaseProducts[1]!,
  panty: showcaseProducts[2]!,
  brief: showcaseProducts[3]!,
};

/** Default slides (Bra) for backwards compatibility and tests */
export const showcaseSlides: ShowcaseSlide[] = braSlides;

export const showcaseColorMap = {
  "bra-1": { braColor: "#b8a3c5", darkColor: "#4a2560" },
  "bra-2": { braColor: "#deceb8", darkColor: "#593e22" },
  "bra-3": { braColor: "#afcbb5", darkColor: "#1d4429" },
  "bra-4": { braColor: "#aac3da", darkColor: "#183659" },
  "bra-5": { braColor: "#eba884", darkColor: "#861c31" },
} as const;
