import fs from 'fs';

let c = fs.readFileSync('src/components/showcase/product-showcase-slider.tsx', 'utf8');

// 1. Signature
const sigSearch = `function ProductInfoCardItem({
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
}) {`;

const sigReplace = `function ProductInfoCardItem({
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
}) {`;

// Replace ignoring line ending differences
c = c.replace(sigSearch.replace(/\r?\n/g, '\r\n'), sigReplace.replace(/\n/g, '\r\n'));
if (!c.includes('productSelector?: React.ReactNode;')) {
  c = c.replace(sigSearch.replace(/\r?\n/g, '\n'), sigReplace);
}

// 2. Mobile selector above card
const mobileSearch = `<motion.div
        className="absolute z-[60] inset-x-3 bottom-14 sm:inset-x-auto sm:left-6 md:left-10 lg:left-14 xl:left-20 sm:bottom-12 md:bottom-16 sm:max-w-[260px] md:max-w-[290px] lg:max-w-[340px] will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        <div className="mx-auto max-w-sm sm:max-w-none text-center sm:text-left rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-4 md:p-5 lg:p-6 backdrop-blur-xl shadow-soft md:shadow-lg">`;

const mobileReplace = `<motion.div
        className="absolute z-[60] inset-x-3 bottom-14 sm:inset-x-auto sm:left-6 md:left-10 lg:left-14 xl:left-20 sm:bottom-12 md:bottom-16 sm:max-w-[260px] md:max-w-[290px] lg:max-w-[340px] will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        {/* Mobile Product Selector: Positioned JUST ABOVE the content card */}
        {productSelector && (
          <div className="sm:hidden mb-2.5 flex items-center justify-center pointer-events-auto">
            {productSelector}
          </div>
        )}

        <div className="mx-auto max-w-sm sm:max-w-none text-center sm:text-left rounded-2xl sm:rounded-3xl border border-border/80 bg-card/90 p-4 sm:p-4 md:p-5 lg:p-6 backdrop-blur-xl shadow-soft md:shadow-lg">`;

c = c.replace(mobileSearch.replace(/\r?\n/g, '\r\n'), mobileReplace.replace(/\n/g, '\r\n'));
if (!c.includes('Mobile Product Selector: Positioned JUST ABOVE the content card')) {
  c = c.replace(mobileSearch.replace(/\r?\n/g, '\n'), mobileReplace);
}

// 3. Desktop selector above button
const desktopSearch = `<motion.div
        className="hidden sm:block absolute z-[60] right-6 md:right-10 lg:right-14 xl:right-20 sm:bottom-12 md:bottom-16 will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        <a`;

const desktopReplace = `<motion.div
        className="hidden sm:flex flex-col items-end gap-3 absolute z-[60] right-6 md:right-10 lg:right-14 xl:right-20 sm:bottom-12 md:bottom-16 will-change-[transform,opacity]"
        style={{ opacity, y, pointerEvents }}
      >
        {/* Desktop Product Selector: Positioned JUST ABOVE the button */}
        {productSelector}

        <a`;

c = c.replace(desktopSearch.replace(/\r?\n/g, '\r\n'), desktopReplace.replace(/\n/g, '\r\n'));
if (!c.includes('Desktop Product Selector: Positioned JUST ABOVE the button')) {
  c = c.replace(desktopSearch.replace(/\r?\n/g, '\n'), desktopReplace);
}

fs.writeFileSync('src/components/showcase/product-showcase-slider.tsx', c, 'utf8');
console.log('Fixed card selector in product-showcase-slider.tsx!');

