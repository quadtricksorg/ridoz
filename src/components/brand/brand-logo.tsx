import React from "react";
import ridozLogoWebp from "@/assets/ridoz-logo.webp";
import ridozLogoPng from "@/assets/ridoz-logo.png";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  /**
   * Logo visual variant:
   * - "full": Official burgundy circular symbol with "Style" script inside bottom opening
   * - "symbol": Isolated burgundy open circular ring symbol
   * - "lockup": Brand mark paired with "RIDOZ." display typography
   */
  variant?: "full" | "symbol" | "lockup";
  /** Preset size variants */
  size?: "sm" | "md" | "lg" | "xl" | "custom";
  /** Optional link href (e.g. "/" or "#drop"). Set to null or "" to render as a div */
  href?: string | null;
  /** Whether to show the "RIDOZ." display wordmark alongside the mark */
  showWordmark?: boolean;
  /** Layout direction for lockup */
  layout?: "horizontal" | "vertical";
  /** Optional custom class name applied to container */
  className?: string;
  /** Optional custom class name applied to logo image */
  imageClassName?: string;
  /** Eager vs lazy loading */
  priority?: boolean;
}

const sizeConfig = {
  sm: {
    height: 32,
    width: 32,
    imgClass: "h-8 w-auto",
    textClass: "text-2xl",
  },
  md: {
    height: 40,
    width: 40,
    imgClass: "h-10 w-auto",
    textClass: "text-3xl",
  },
  lg: {
    height: 48,
    width: 48,
    imgClass: "h-12 w-auto",
    textClass: "text-4xl",
  },
  xl: {
    height: 64,
    width: 64,
    imgClass: "h-16 w-auto",
    textClass: "text-5xl",
  },
  custom: {
    height: 40,
    width: 40,
    imgClass: "",
    textClass: "text-3xl",
  },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "full",
  size = "md",
  href = "#drop",
  showWordmark = false,
  layout = "horizontal",
  className,
  imageClassName,
  priority = true,
}) => {
  const currentSize = sizeConfig[size] || sizeConfig.md;
  const isLockup = variant === "lockup" || showWordmark;

  const logoMark = (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        currentSize.imgClass,
        imageClassName
      )}
      style={{
        aspectRatio: "1 / 1",
      }}
    >
      {variant === "symbol" ? (
        // Scalable SVG burgundy open ring symbol
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full object-contain"
          aria-hidden="true"
        >
          <path
            d="M 26.82 83.02 A 42 42 0 1 1 73.18 83.02 L 65.34 71.18 A 27.8 27.8 0 1 0 34.66 71.18 Z"
            fill="var(--primary, #a51538)"
          />
        </svg>
      ) : (
        // Full official brand logo (Burgundy ring + "Style" script)
        <picture className="contents">
          <source srcSet={ridozLogoWebp} type="image/webp" />
          <img
            src={ridozLogoPng}
            alt="RIDOZ Style"
            width={currentSize.width}
            height={currentSize.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-auto object-contain select-none"
          />
        </picture>
      )}
    </div>
  );

  const wordmark = (
    <span
      className={cn(
        "font-display font-bold leading-none tracking-tight text-[#a51538] select-none",
        currentSize.textClass
      )}
    >
      RIDOZ
    </span>
  );

  const content = isLockup ? (
    <div
      className={cn(
        "inline-flex items-center gap-2.5",
        layout === "vertical" && "flex-col items-center gap-3 text-center",
        className
      )}
    >
      {logoMark}
      {wordmark}
    </div>
  ) : (
    <div className={cn("inline-flex items-center", className)}>
      {logoMark}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label="RIDOZ Style, back to top"
        className="group inline-flex items-center transition-opacity hover:opacity-95"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default BrandLogo;

