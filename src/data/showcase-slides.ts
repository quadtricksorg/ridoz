import design1 from "@/assets/showcase/design1.png";
import design2 from "@/assets/showcase/design2.png";
import design3 from "@/assets/showcase/design3.png";
import design4 from "@/assets/showcase/design4.png";
import design5 from "@/assets/showcase/design5.png";

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
  /** Dark plain background start/ambient color (derived from bra color) */
  bgFrom: string;
  /** Dark plain background edge color (derived from bra color) */
  bgTo: string;
  /** Exact sampled color of the bra (used for low-opacity flower animations and tones) */
  braColor: string;
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

/**
 * Single source of truth for the Product Showcase Slider.
 * To add a new design:
 *  1. Drop your PNG image into `src/assets/showcase/your-image.png`
 *  2. Import it above and append a new object to this array.
 */
export const showcaseSlides: ShowcaseSlide[] = [
  {
    id: "design-1",
    image: design1,
    title: "LAVENDER",
    productName: "Lilac Cloud Wirefree Bra",
    shortDescription: "Featherweight microfiber cups sculpted for natural lift and zero pinch.",
    price: "₹1,499",
    // Dark plain background matching the lilac/lavender bra
    bgFrom: "#1c1322",
    bgTo: "#100a14",
    braColor: "#b8a3c5",
    accentColor: "#c6b2d4",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Lilac Cloud Wirefree Bra in soft lavender microfiber",
    tag: "Cloud Lift",
    isTransparent: true,
  },
  {
    id: "design-2",
    image: design2,
    title: "VANILLA",
    productName: "Champagne Bare Contour Bra",
    shortDescription: "Ultra-smooth molded support invisible under even the lightest fabrics.",
    price: "₹1,599",
    // Dark plain background matching the champagne nude bra
    bgFrom: "#1d1711",
    bgTo: "#110d09",
    braColor: "#deceb8",
    accentColor: "#e2d4c0",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Champagne Bare Contour Bra in seamless nude tone",
    tag: "Second Skin",
    isTransparent: true,
  },
  {
    id: "design-3",
    image: design3,
    title: "EUCALYPTUS",
    productName: "Sage Whisper Wireless Bra",
    shortDescription: "Breathable organic modal weave featuring soft-rib support band with zero pressure.",
    price: "₹1,499",
    // Dark plain background matching the eucalyptus sage mint bra
    bgFrom: "#101c14",
    bgTo: "#09110b",
    braColor: "#afcbb5",
    accentColor: "#b8d2be",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Sage Whisper Wireless Bra in calming eucalyptus mint",
    tag: "Natural Touch",
    isTransparent: true,
  },
  {
    id: "design-4",
    image: design4,
    title: "AZURE",
    productName: "Powder Sky Seamless Balconette",
    shortDescription: "Silky double-knit microfiber with gentle side-smoothing support wings.",
    price: "₹1,549",
    // Dark plain background matching the powder sky azure bra
    bgFrom: "#101924",
    bgTo: "#080e15",
    braColor: "#aac3da",
    accentColor: "#b5cce0",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Powder Sky Seamless Balconette in airy powder blue",
    tag: "Silky Molded",
    isTransparent: true,
  },
  {
    id: "design-5",
    image: design5,
    title: "TERRA",
    productName: "Rose Clay Comfort Contour Bra",
    shortDescription: "Adaptive stretch cups that move seamlessly with your body from morning to dusk.",
    price: "₹1,499",
    // Dark plain background matching the terracotta rose clay bra
    bgFrom: "#24130c",
    bgTo: "#140905",
    braColor: "#eba884",
    accentColor: "#f0b596",
    ctaLabel: "Shop This Look",
    link: "#shop",
    alt: "Rose Clay Comfort Contour Bra in rich blush terracotta",
    tag: "Velvet Soft",
    isTransparent: true,
  },
];

