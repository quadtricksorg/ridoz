import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route } from "@/routes/index";

describe("Navbar Enquiry WhatsApp Button", () => {
  it("renders Enquiry button pointing to WhatsApp with pre-filled message", () => {
    const Component = Route.options.component;
    if (!Component) throw new Error("Component not found on Route");

    render(<Component />);

    // Query enquiry buttons (desktop and mobile)
    const enquiryButtons = screen.getAllByRole("link", { name: /^Enquiry$/i });
    expect(enquiryButtons.length).toBeGreaterThanOrEqual(1);

    const desktopButton = enquiryButtons[0];
    expect(desktopButton).toBeDefined();

    const href = desktopButton.getAttribute("href");
    expect(href).toBeDefined();
    expect(href).toMatch(/^https:\/\/wa\.me\/917510441075\?text=/);

    // Verify WhatsApp parameters
    const url = new URL(href!);
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/917510441075");

    const messageParam = url.searchParams.get("text");
    expect(messageParam).toBe(
      "Hi, I'm interested in your innerwear products. Could you please share details about sample availability, pricing, and the process for obtaining samples? Looking forward to hearing from you."
    );

    // Security attributes for external links
    expect(desktopButton).toHaveAttribute("target", "_blank");
    expect(desktopButton).toHaveAttribute("rel", "noopener noreferrer");
  });
});
