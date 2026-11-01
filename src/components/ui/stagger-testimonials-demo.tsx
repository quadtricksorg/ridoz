import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";

const testimonials = [
  { testimonial: "Soft fabric that stays comfortable from morning meetings to late nights.", by: "Anjali R., Verified buyer" },
  { testimonial: "Stitching holds up wash after wash. The waistband never rolls.", by: "Rahul M., Verified buyer" },
  { testimonial: "Breathable, light and fits perfectly. I've ordered three more packs.", by: "Sneha K., Verified buyer" },
];

const DemoOne = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <StaggerTestimonials testimonials={testimonials} />
  </div>
);

export { DemoOne };
