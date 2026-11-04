import { createFileRoute } from "@tanstack/react-router";
import { ProductShowcaseSlider } from "@/components/showcase/product-showcase-slider";

export const Route = createFileRoute("/showcase")({
  head: () => ({
    meta: [
      { title: "Innerwear Colorway Showcase | RIDOZ Style" },
      { name: "description", content: "Flavour slider showcase for RIDOZ premium innerwear." },
    ],
  }),
  component: ShowcasePage,
});

function ShowcasePage() {
  return (
    <main className="min-h-screen w-full bg-background text-foreground overflow-x-clip">
      <ProductShowcaseSlider />
    </main>
  );
}

