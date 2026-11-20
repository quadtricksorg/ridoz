import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    // Never disabled: past either end the slider moves on to the neighbouring product
    expect(prevBtn).not.toBeDisabled();
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

  it("shows the product feature row in the info card and keeps it when switching colourways", () => {
    render(<ProductShowcaseSlider />);

    expect(screen.getAllByText(/natural/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/breathable/i).length).toBeGreaterThan(0);

    const dots = screen.getAllByRole("tab");
    fireEvent.click(dots[2]!);
    expect(dots[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText(/breathable/i).length).toBeGreaterThan(0);
  });

  it("handles keyboard navigation with ArrowRight / ArrowLeft and leaves ArrowDown / ArrowUp to page scroll", () => {
    render(<ProductShowcaseSlider />);

    const carousel = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });
    carousel.focus();
    const dots = screen.getAllByRole("tab");

    fireEvent.keyDown(carousel, { key: "ArrowDown" });
    expect(dots[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(dots[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
  });

  it("ignores vertical wheel scroll but advances on a horizontal trackpad swipe", () => {
    render(<ProductShowcaseSlider />);

    const carousel = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });
    const dots = screen.getAllByRole("tab");

    fireEvent.wheel(carousel, { deltaY: 100 });
    expect(dots[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.wheel(carousel, { deltaX: 100 });
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

  it("renders product category selector and switches slides when clicking another product", async () => {
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

    // The product swaps mid-way through the fade-through hand-off
    await waitFor(() =>
      expect(screen.getAllByRole("radio", { name: /boxer/i })[0]).toHaveAttribute("aria-checked", "true"),
      { timeout: 3000 },
    );

    // Live announcement or active slide should now display Boxer
    expect(screen.getByText(/showing slide 1 of 5:.*boxer/i)).toBeInTheDocument();
  });

  it("moves on to the next product after the last colour instead of rewinding", async () => {
    render(<ProductShowcaseSlider />);
    const nextBtn = screen.getByRole("button", { name: /next design slide/i });
    const braCount = showcaseProductsMap.bra.slides.length;

    fireEvent.click(screen.getAllByRole("tab")[braCount - 1]!);
    fireEvent.click(nextBtn);

    await waitFor(() =>
      expect(screen.getAllByRole("radio", { name: /boxer/i })[0]).toHaveAttribute("aria-checked", "true"),
      { timeout: 3000 },
    );
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("goes back to the previous product's last colour from the first colour (looping)", async () => {
    render(<ProductShowcaseSlider />);
    fireEvent.click(screen.getByRole("button", { name: /previous design slide/i }));

    await waitFor(() =>
      expect(screen.getAllByRole("radio", { name: /brief/i })[0]).toHaveAttribute("aria-checked", "true"),
      { timeout: 3000 },
    );
    const dots = screen.getAllByRole("tab");
    expect(dots.length).toBe(showcaseProductsMap.brief.slides.length);
    expect(dots[dots.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("switches colour on a horizontal touch swipe but not on a vertical one", () => {
    render(<ProductShowcaseSlider />);
    const slider = screen.getByRole("region", { name: /innerwear colorway showcase slider/i });
    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "true");

    // Vertical swipe: plain page scroll, colour unchanged
    fireEvent.touchStart(slider, { touches: [{ clientX: 100, clientY: 300 }] });
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 100, clientY: 100 }] });
    expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");

    // Horizontal swipe LEFT -> next colour
    fireEvent.touchStart(slider, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchEnd(slider, { changedTouches: [{ clientX: 120, clientY: 210 }] });
    expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
  });
});
