import fs from 'fs';

let c = fs.readFileSync('src/test/product-showcase-slider.test.tsx', 'utf8');

c = c.replace(
  'import { showcaseSlides } from "@/data/showcase-slides";',
  'import { showcaseSlides, showcaseProducts, showcaseProductsMap } from "@/data/showcase-slides";'
);

const newTests = `
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
    fireEvent.click(boxerButtons[0]);

    // Boxer is now active
    expect(boxerButtons[0]).toHaveAttribute("aria-checked", "true");

    // Live announcement or active slide should now display Boxer
    const live = screen.getByText(/showing slide 1 of 5:.*boxer/i);
    expect(live).toBeInTheDocument();
  });
});`;

c = c.replace(/\n\}\);\s*$/, newTests);
fs.writeFileSync('src/test/product-showcase-slider.test.tsx', c, 'utf8');
console.log('Tests added successfully!');

