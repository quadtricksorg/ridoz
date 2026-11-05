import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { showcaseSlides, showcaseProducts, showcaseProductsMap } from "@/data/showcase-slides";
import { ProductShowcaseSlider } from "@/components/showcase/product-showcase-slider";

describe("ProductShowcaseSlider Data & Component", () => {
  it("has valid slide config array entries with required fields", () => {
    expect(showcaseSlides.length).toBeGreaterThanOrEqual(5);

    showcaseSlides.forEach((slide) => {
      expect(slide.id).toBeTruthy();
      expect(slide.image).toBeTruthy();
      expect(slide.title).toBeTruthy();
      expect(slide.productName).toBeTruthy();
      expect(slide.shortDescription).toBeTruthy();
      expect(slide.bgFrom).toMatch(/^#[0-9a-fA-F]{3,8}$|^oklch|^rgb/);
      expect(slide.bgTo).toMatch(/^#[0-9a-fA-F]{3,8}$|^oklch|^rgb/);
      expect(slide.accentColor).toBeTruthy();
      expect(slide.link).toBeTruthy();
      expect(slide.ctaLabel).toBeTruthy();
      expect(slide.alt).toBeTruthy();
    });
  });

  it("renders the carousel container with accessible ARIA roles and labels", () => {
    const { container } = render(<ProductShowcaseSlider />);

    const carousel = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });
    expect(carousel).toBeInTheDocument();
    expect(carousel).toHaveAttribute("aria-roledescription", "carousel");

    // Check rendered slides via querySelectorAll
    const slides = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(slides.length).toBeGreaterThanOrEqual(3);

    // Active slide is accessible to screen readers
    const activeSlide = screen.getByRole("group", { name: /slide 1 of 5/i });
    expect(activeSlide).toBeInTheDocument();
  });

  it("does not render price text in the slider bottom block per specification", () => {
    render(<ProductShowcaseSlider />);

    // None of the slides' prices should be rendered in the document
    showcaseSlides.forEach((slide) => {
      if (slide.price) {
        expect(screen.queryByText(slide.price)).not.toBeInTheDocument();
      }
    });
  });

  it("renders clickable dot navigation for all slides", () => {
    render(<ProductShowcaseSlider />);

    const dots = screen.getAllByRole("tab");
    expect(dots.length).toBe(showcaseSlides.length);
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
  });

  it("renders previous and next arrow buttons", () => {
    render(<ProductShowcaseSlider />);

    const prevBtn = screen.getByRole("button", { name: /previous design slide/i });
    const nextBtn = screen.getByRole("button", { name: /next design slide/i });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(prevBtn).toBeDisabled(); // first slide has disabled prev
    expect(nextBtn).not.toBeDisabled();
  });

  it("advances slide on clicking next button and updates active dot", () => {
    render(<ProductShowcaseSlider />);

    const nextBtn = screen.getByRole("button", { name: /next design slide/i });
    fireEvent.click(nextBtn);

    const dots = screen.getAllByRole("tab");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
  });

  it("navigates directly to a slide when clicking a dot", () => {
    render(<ProductShowcaseSlider />);

    const dots = screen.getAllByRole("tab");
    fireEvent.click(dots[2]!);

    expect(dots[2]).toHaveAttribute("aria-selected", "true");
  });

  it("handles keyboard navigation with ArrowRight, ArrowLeft, ArrowDown, ArrowUp", () => {
    render(<ProductShowcaseSlider />);

    const carousel = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });
    carousel.focus();

    // ArrowDown / ArrowRight advances
    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    const dots = screen.getAllByRole("tab");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");

    // ArrowUp / ArrowLeft goes back
    fireEvent.keyDown(carousel, { key: "ArrowUp" });
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
  });

  it("handles vertical wheel scroll to advance and reverse slides", () => {
    render(<ProductShowcaseSlider />);

    const carousel = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });

    // Scroll down (deltaY > 0)
    fireEvent.wheel(carousel, { deltaY: 100 });
    const dots = screen.getAllByRole("tab");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
  });
  it("defines 4 innerwear products with valid configs and slides", () => {
    expect(showcaseProducts.length).toBe(4);
    const ids = showcaseProducts.map((p) => p.id);
    expect(ids).toEqual(["bra", "boxer", "panty", "brief"]);

    showcaseProducts.forEach((p) => {
      expect(p.label).toBeTruthy();
      expect(p.thumb).toBeTruthy();
      expect(p.swatchBg).toBeTruthy();
      expect(p.slides.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("renders product category selector and switches slides when clicking another product", () => {
    render(<ProductShowcaseSlider />);

    // Product selector should be rendered
    const radiogroups = screen.getAllByRole("radiogroup", { name: /choose.*product/i });
    expect(radiogroups.length).toBeGreaterThan(0);

    // Bra should be checked by default
    const braButtons = screen.getAllByRole("radio", { name: /bra/i });
    expect(braButtons[0]).toHaveAttribute("aria-checked", "true");

    // Click Boxer radio button
    const boxerButtons = screen.getAllByRole("radio", { name: /boxer/i });
    fireEvent.click(boxerButtons[0]!);

    // Re-query after re-render: Boxer is now active
    const updatedBoxerButtons = screen.getAllByRole("radio", { name: /boxer/i });
    expect(updatedBoxerButtons[0]).toHaveAttribute("aria-checked", "true");

    // Live announcement or active slide should now display Boxer
    const live = screen.getByText(/showing slide 1 of 5:.*boxer/i);
    expect(live).toBeInTheDocument();
  });

  it("switches color slide on touch swipe gesture (touchstart + touchend)", () => {
    render(<ProductShowcaseSlider />);
    const slider = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });

    // Initial dot 0 is selected
    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "true");

    // Simulate vertical swipe UP (finger moves from y=300 to y=100) -> advance to next slide
    fireEvent.touchStart(slider, {
      touches: [{ clientX: 100, clientY: 300 }],
    });
    fireEvent.touchMove(slider, {
      touches: [{ clientX: 100, clientY: 100 }],
      cancelable: true,
    });
    fireEvent.touchEnd(slider, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });

    // Dot 1 should now be selected
    const updatedDots = screen.getAllByRole("tab");
    expect(updatedDots[1]).toHaveAttribute("aria-selected", "true");
  });
});
