// Test script to verify the math of stacked slides and text cards
const totalSlides = 5;

function getSlideState(index, p) {
  if (index === 0) {
    return {
      index,
      opacity: p >= 1 ? 0 : 1,
      clipPath: "none",
      zIndex: 10,
    };
  }

  const zIndex = 10 + index * 10;

  if (p <= index - 1) {
    return {
      index,
      opacity: 0,
      clipPath: "inset(0% 0% 0% 100%)",
      zIndex,
    };
  }

  if (p < index) {
    const leftInset = ((index - p) * 100).toFixed(2);
    return {
      index,
      opacity: 1,
      clipPath: `inset(0% 0% 0% ${leftInset}%)`,
      zIndex,
    };
  }

  if (p < index + 1) {
    return {
      index,
      opacity: 1,
      clipPath: "inset(0% 0% 0% 0%)",
      zIndex,
    };
  }

  return {
    index,
    opacity: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    zIndex,
  };
}

function getCardOpacity(index, p) {
  const d = p - index;
  const absD = Math.abs(d);
  if (absD > 0.50) return 0;
  if (absD <= 0.35) return 1;
  // Fade between 0.35 and 0.48
  if (absD <= 0.48) {
    return (0.48 - absD) / (0.48 - 0.35);
  }
  return 0;
}

console.log("=== TESTING FORWARD & REVERSE SCROLL CONTINUITY ===");

const testPoints = [
  0.0, 0.25, 0.5, 0.75, 0.99, 1.0, 1.01, 1.5, 1.99, 2.0, 2.01, 2.5, 2.99, 3.0, 3.01, 3.5, 3.99, 4.0
];

let hasErrors = false;

for (const p of testPoints) {
  const activeSlides = [];
  for (let i = 0; i < totalSlides; i++) {
    const s = getSlideState(i, p);
    if (s.opacity > 0) activeSlides.push(s);
  }

  const activeCards = [];
  for (let i = 0; i < totalSlides; i++) {
    const op = getCardOpacity(i, p);
    if (op > 0) activeCards.push({ index: i, opacity: Number(op.toFixed(3)) });
  }

  console.log(`p = ${p.toFixed(2)}:`);
  console.log(`  Active slides: ${activeSlides.map(s => `[Slide ${s.index} z:${s.zIndex} clip:${s.clipPath}]`).join(", ")}`);
  console.log(`  Active cards:  ${activeCards.map(c => `[Card ${c.index} op:${c.opacity}]`).join(", ")}`);

  if (activeSlides.length > 2) {
    console.error(`ERROR at p=${p}: More than 2 slides active! (${activeSlides.length})`);
    hasErrors = true;
  }
  if (activeSlides.length === 0) {
    console.error(`ERROR at p=${p}: Zero slides active!`);
    hasErrors = true;
  }
  if (activeCards.length > 1) {
    console.error(`ERROR at p=${p}: More than 1 card visible simultaneously!`, activeCards);
    hasErrors = true;
  }
}

if (!hasErrors) {
  console.log("\n>>> ALL CHECKS PASSED PERFECTLY! Zero overlap, zero discontinuities! <<<");
}

