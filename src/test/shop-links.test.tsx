import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NewArrivals } from "@/components/new-arrivals/hanger-rail";
import { RAIL_PRODUCTS } from "@/data/products";
import { showcaseProducts } from "@/data/showcase-slides";
import { CTA_TO_RAIL, LOOK_TO_RAIL, goToRail, railIndexOf } from "@/lib/shop-links";

const selectedChip = () =>
  screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");

describe("shop links", () => {
  it("maps every colour-slider look to the same garment and photo on the rail", () => {
    const slides = showcaseProducts.flatMap((g) => g.slides);
    expect(Object.keys(LOOK_TO_RAIL)).toHaveLength(slides.length);
    for (const s of slides) {
      const look = LOOK_TO_RAIL[s.id]!;
      expect(look.railIndex).toBeGreaterThanOrEqual(0);
      expect(RAIL_PRODUCTS[look.railIndex]!.id).toBe(look.railProductId);
      expect(look.slideImage).toBe(s.image);
      expect(look.railImage).toBe(RAIL_PRODUCTS[look.railIndex]!.image);
      expect(look.slideImage).toBe(look.railImage);
    }
  });

  it("sends Explore the collection to Panties and Shop boxers to Trunks", () => {
    expect(RAIL_PRODUCTS[railIndexOf(CTA_TO_RAIL.trioExplore)]!.category).toBe("panty");
    expect(RAIL_PRODUCTS[railIndexOf(CTA_TO_RAIL.featureShopBoxers)]!.category).toBe("trunk");
  });

  it("brings the chosen look to the front of the rail", async () => {
    Element.prototype.scrollIntoView = () => {}; // not implemented in jsdom
    render(<NewArrivals />); // the rail section itself is #shop
    const look = LOOK_TO_RAIL["trunk-navy"]!;
    act(() => goToRail(look.target));
    expect(selectedChip()).toHaveTextContent("Trunks");
    expect(await screen.findByText(look.name)).toBeInTheDocument();

    act(() => goToRail(CTA_TO_RAIL.trioExplore));
    expect(selectedChip()).toHaveTextContent("Panties");
  });
});
