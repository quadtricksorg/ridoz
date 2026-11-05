import fs from 'fs';

const filePath = 'src/components/showcase/product-showcase-slider.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add ProductSelector before ProductInfoCardItem
const productSelectorCode = `/**
 * ProductSelector Component:
 * Circular product swatches (Bra, Boxer, Panty, Brief) matching the Hero section's design.
 * Lets the user switch between product categories with instant reset to slide 0.
 */
function ProductSelector({
  selectedProduct,
  onSelectProduct,
  className = "",
}: {
  selectedProduct: ShowcaseProductType;
  onSelectProduct: (p: ShowcaseProductType) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose innerwear product"
      className={\`inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-border/80 bg-card/90 px-2.5 py-1.5 backdrop-blur-xl shadow-soft md:shadow-md \${className}\`}
    >
      {showcaseProducts.map((p) => {
        const isSelected = selectedProduct === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={\`\${p.label} (\${p.tag})\`}
            title={\`\${p.label} - \${p.name}\`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(p.id);
            }}
            style={{ backgroundColor: p.swatchBg }}
            className={\`relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full p-1 transition-all duration-200 \${
              isSelected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-sm"
                : "opacity-75 hover:opacity-100 hover:scale-105"
            }\`}
          >
            <img
              src={p.thumb}
              alt=""
              draggable={false}
              className="h-full w-full object-contain pointer-events-none select-none"
            />
          </button>
        );
      })}
    </div>
  );
}

`;

content = content.replace('function ProductInfoCardItem({', productSelectorCode + 'function ProductInfoCardItem({');

// 2. Update ProductInfoCardItem parameters to include productSelector
content = content.replace(
`function ProductInfoCardItem({
  slide,
  index,
  progress,
  isReducedMotion,
  onExplore,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
  onExplore: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {`,
`function ProductInfoCardItem({
  slide,
  index,
  progress,
  isReducedMotion,
  onExplore,
  productSelector,
}: {
  slide: ShowcaseSlide;
  index: number;
  progress: MotionValue<number>;
  isReducedMotion: boolean;
  onExplore: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  productSelector?: React.ReactNode;
}) {`
);

// 3. Update the JSX inside ProductInfoCardItem for mobile and desktop productSelector placement
const oldCardMarkup = `<motion.div
        className="absolute z-[60] inset-x-3 bottom-14 sm:inset-x-auto sm:left-6 md:left-10 lg:left-14 xl:left-20 sm:bottom-12 md:bottom-16 sm:max-w-[260px] md:max-w-[290px] lg:max-w-[340px] will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        <div className="mx-auto max-w-sm sm:max-w-none text-center sm:text-left rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-4 md:p-5 lg:p-6 backdrop-blur-xl shadow-soft md:shadow-lg">`;

const newCardMarkup = `<motion.div
        className="absolute z-[60] inset-x-3 bottom-14 sm:inset-x-auto sm:left-6 md:left-10 lg:left-14 xl:left-20 sm:bottom-12 md:bottom-16 sm:max-w-[260px] md:max-w-[290px] lg:max-w-[340px] will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        {/* Mobile Product Selector: Positioned JUST ABOVE the content card */}
        {productSelector && (
          <div className="sm:hidden mb-2.5 flex items-center justify-center">
            {productSelector}
          </div>
        )}

        <div className="mx-auto max-w-sm sm:max-w-none text-center sm:text-left rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-4 md:p-5 lg:p-6 backdrop-blur-xl shadow-soft md:shadow-lg">`;

content = content.replace(oldCardMarkup, newCardMarkup);

// Update desktop floating container to include productSelector
const oldDesktopButton = `<motion.div
        className="hidden sm:block absolute z-[60] right-6 md:right-10 lg:right-14 xl:right-20 sm:bottom-12 md:bottom-16 will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        <a
          href={slide.link || "#shop"}`;

const newDesktopButton = `<motion.div
        className="hidden sm:flex flex-col items-end gap-3 absolute z-[60] right-6 md:right-10 lg:right-14 xl:right-20 sm:bottom-12 md:bottom-16 will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        {/* Desktop Product Selector: Positioned JUST ABOVE the button */}
        {productSelector}

        <a
          href={slide.link || "#shop"}`;

content = content.replace(oldDesktopButton, newDesktopButton);

// 4. Update ProductShowcaseSlider state and activeSlides
content = content.replace(
  'const totalSlides = showcaseSlides.length;',
  `const [selectedProduct, setSelectedProduct] = useState<ShowcaseProductType>("bra");
  const currentProductItem = showcaseProductsMap[selectedProduct] || showcaseProducts[0]!;
  const activeSlides = currentProductItem.slides;
  const totalSlides = activeSlides.length;

  const handleSelectProduct = (newProduct: ShowcaseProductType) => {
    if (newProduct === selectedProduct) return;
    setSelectedProduct(newProduct);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    progress.set(0);

    // Scroll window smoothly to the top of the showcase track to reset to first color
    if (typeof window !== "undefined" && trackRef.current) {
      isProgrammaticUntilRef.current = Date.now() + 850;
      const rect = trackRef.current.getBoundingClientRect();
      const trackTop = window.scrollY + rect.top;
      window.scrollTo({
        top: trackTop,
        behavior: "smooth",
      });
    }
  };`
);

// 5. Replace showcaseSlides with activeSlides throughout the render layers
content = content.replace('<link rel="preload" as="image" href={showcaseSlides[0]?.image} />', '<link rel="preload" as="image" href={activeSlides[0]?.image} />');

content = content.replace(
  `{showcaseSlides.map((slide, idx) => (
          <SlideTitleBounceLayer
            key={\`title-\${slide.id}\`}`,
  `{activeSlides.map((slide, idx) => (
          <SlideTitleBounceLayer
            key={\`\${selectedProduct}-title-\${slide.id}\`}`
);

content = content.replace(
  `{showcaseSlides.map((slide, idx) => (
          <SlideStationaryBraLayer
            key={\`bra-\${slide.id}\`}`,
  `{activeSlides.map((slide, idx) => (
          <SlideStationaryBraLayer
            key={\`\${selectedProduct}-bra-\${slide.id}\`}`
);

content = content.replace(
  `{showcaseSlides.map((slide, idx) => (
            <FloatingAccentsItem
              key={\`accents-\${slide.id}\`}`,
  `{activeSlides.map((slide, idx) => (
            <FloatingAccentsItem
              key={\`\${selectedProduct}-accents-\${slide.id}\`}`
);

content = content.replace(
  `{showcaseSlides.map((slide, idx) => (
          <ProductInfoCardItem
            key={\`card-\${slide.id}\`}
            slide={slide}
            index={idx}
            progress={progress}
            isReducedMotion={isReducedMotion}
            onExplore={handleExploreClick}
          />
        ))}`,
  `{activeSlides.map((slide, idx) => (
          <ProductInfoCardItem
            key={\`\${selectedProduct}-card-\${slide.id}\`}
            slide={slide}
            index={idx}
            progress={progress}
            isReducedMotion={isReducedMotion}
            onExplore={handleExploreClick}
            productSelector={
              <ProductSelector
                selectedProduct={selectedProduct}
                onSelectProduct={handleSelectProduct}
              />
            }
          />
        ))}`
);

content = content.replace(
  `{showcaseSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}`,
  `{activeSlides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={\`\${selectedProduct}-dot-\${slide.id}\`}`
);

content = content.replace(
  'Showing slide {currentIndex + 1} of {totalSlides}: {showcaseSlides[currentIndex]?.productName}',
  'Showing slide {currentIndex + 1} of {totalSlides}: {activeSlides[currentIndex]?.productName}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('product-showcase-slider.tsx successfully updated!');

