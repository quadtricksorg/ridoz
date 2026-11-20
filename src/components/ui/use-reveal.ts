import { useEffect, type RefObject } from "react";

/**
 * One-off scroll entrance for a section: its `[data-reveal-item]` children animate in
 * the first time the section scrolls into view (styles in src/styles.css).
 *
 * The hidden "pending" state is only applied after hydration and only while the section
 * is off-screen, so server HTML is never hidden and on-screen content never flashes.
 */
export function useReveal(ref: RefObject<HTMLElement | null>, amount = 0.18) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.85 && r.bottom > 0) return; // already on screen

    el.dataset["reveal"] = "pending";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.dataset["reveal"] = "in";
        io.disconnect();
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, amount]);
}
