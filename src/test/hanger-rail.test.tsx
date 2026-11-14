import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NewArrivals } from "@/components/new-arrivals/hanger-rail";
import { CATEGORIES, PRODUCTS } from "@/data/products";

const selectedChip = () =>
  screen.getAllByRole("tab").find((t) => t.getAttribute("aria-selected") === "true");

describe("New Arrivals hanger rail", () => {
  it("has a webp image and a known category for every product", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(30);
    for (const p of PRODUCTS) {
      expect(p.image).toMatch(/\.webp/);
      expect(ids.has(p.category)).toBe(true);
    }
  });

  it("renders one chip per category and starts on the first product", () => {
    render(<NewArrivals />);
    expect(screen.getAllByRole("tab")).toHaveLength(CATEGORIES.length);
    expect(selectedChip()).toHaveTextContent(CATEGORIES[0]!.label);
    expect(screen.getByText(PRODUCTS[0]!.name)).toBeInTheDocument();
  });

  it("jumps the rail to a category when its chip is clicked", async () => {
    render(<NewArrivals />);
    fireEvent.click(screen.getByRole("tab", { name: "Briefs" }));
    expect(selectedChip()).toHaveTextContent("Briefs");
    const firstBrief = PRODUCTS.find((p) => p.category === "brief")!;
    expect(await screen.findByText(firstBrief.name)).toBeInTheDocument();
  });

  it("updates the selected chip when browsing the rail across a category boundary", () => {
    render(<NewArrivals />);
    const lastBra = PRODUCTS.map((p) => p.category).lastIndexOf("bra");
    const prev = screen.getByRole("button", { name: /previous product/i });
    // wrap backwards from the first bra to the last product (Vests & Tees)
    fireEvent.click(prev);
    expect(selectedChip()).toHaveTextContent("Vests & Tees");
    fireEvent.click(screen.getByRole("tab", { name: "Bras" }));
    const next = screen.getByRole("button", { name: /next product/i });
    for (let i = 0; i <= lastBra; i++) fireEvent.click(next);
    expect(selectedChip()).toHaveTextContent("Panties");
  });

  it("supports keyboard arrows on the rail", async () => {
    render(<NewArrivals />);
    const rail = screen.getByRole("region", { name: /products on the rail/i });
    fireEvent.keyDown(rail, { key: "ArrowRight" });
    expect(await screen.findByText(PRODUCTS[1]!.name)).toBeInTheDocument();
  });
});
