import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewArrivals } from "@/components/new-arrivals/hanger-rail";
import { RAIL_CATEGORIES, RAIL_PRODUCTS, SIZES } from "@/data/products";

const selectedChip = () =>
  screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");

describe("Shop by collection hanger rail", () => {
  it("has a webp image and a known category for every product, and no vests or tees", () => {
    const ids = new Set(RAIL_CATEGORIES.map((c) => c.id));
    expect(RAIL_PRODUCTS.length).toBeGreaterThanOrEqual(25);
    for (const p of RAIL_PRODUCTS) {
      expect(p.image).toMatch(/\.webp/);
      expect(ids.has(p.category)).toBe(true);
    }
    expect(ids.has("top" as never)).toBe(false);
  });

  it("renders one chip per category, the new title and starts on the first product", () => {
    render(<NewArrivals />);
    expect(screen.getByRole("heading", { name: /shop by collection/i })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(RAIL_CATEGORIES.length);
    expect(screen.queryByRole("tab", { name: /vests/i })).toBeNull();
    expect(selectedChip()).toHaveTextContent(RAIL_CATEGORIES[0]!.label);
    expect(screen.getByText(RAIL_PRODUCTS[0]!.name)).toBeInTheDocument();
  });

  it("lists every size from XS to XXL", () => {
    render(<NewArrivals />);
    const list = screen.getByRole("list", { name: /available sizes/i });
    expect([...list.querySelectorAll("li")].map((li) => li.textContent)).toEqual([...SIZES]);
    expect(SIZES).toEqual(["XS", "S", "M", "L", "XL", "XXL"]);
  });

  it("jumps the rail to a category when its chip is clicked", async () => {
    render(<NewArrivals />);
    fireEvent.click(screen.getByRole("tab", { name: "Briefs" }));
    expect(selectedChip()).toHaveTextContent("Briefs");
    const firstBrief = RAIL_PRODUCTS.find((p) => p.category === "brief")!;
    expect(await screen.findByText(firstBrief.name)).toBeInTheDocument();
  });

  it("updates the selected chip when browsing the rail across a category boundary", () => {
    render(<NewArrivals />);
    const lastBra = RAIL_PRODUCTS.map((p) => p.category).lastIndexOf("bra");
    const prev = screen.getByRole("button", { name: /previous product/i });
    // wrap backwards from the first bra to the last product (Trunks)
    fireEvent.click(prev);
    expect(selectedChip()).toHaveTextContent("Trunks");
    fireEvent.click(screen.getByRole("tab", { name: "Bras" }));
    const next = screen.getByRole("button", { name: /next product/i });
    for (let i = 0; i <= lastBra; i++) fireEvent.click(next);
    expect(selectedChip()).toHaveTextContent("Panties");
  });

  it("supports keyboard arrows on the rail", async () => {
    render(<NewArrivals />);
    const rail = screen.getByRole("region", { name: /products on the rail/i });
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(await screen.findByText(RAIL_PRODUCTS[1]!.name)).toBeInTheDocument();
  });
});
