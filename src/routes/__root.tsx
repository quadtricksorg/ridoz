import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RIDOZ Style | Premium Innerwear & Loungewear" },
      {
        name: "description",
        content:
          "Experience effortless luxury and comfort with RIDOZ Style. Precision-engineered premium innerwear, breathable fabrics, and all-day confidence.",
      },
      { name: "theme-color", content: "#a51538" },
      { name: "msapplication-TileColor", content: "#a51538" },
      // Open Graph
      { property: "og:site_name", content: "RIDOZ Style" },
      { property: "og:title", content: "RIDOZ Style | Premium Innerwear & Loungewear" },
      {
        property: "og:description",
        content:
          "Seamless support, all-day comfort. Engineered for performance, made for every day.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/assets/brand/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "RIDOZ Style Official Brand" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "RIDOZ Style | Premium Innerwear" },
      {
        name: "twitter:description",
        content:
          "Seamless support, all-day comfort. Engineered for performance, made for every day.",
      },
      { name: "twitter:image", content: "/assets/brand/og-image.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Google search favicon & browser tab icons
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/assets/brand/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { rel: "icon", href: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Montserrat:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RIDOZ Style",
  alternateName: "RIDOZ",
  url: "https://ridozstyle.com",
  logo: "https://ridozstyle.com/assets/brand/ridoz-logo.png",
  image: "https://ridozstyle.com/assets/brand/og-image.png",
  description:
    "Premium fashion innerwear brand engineered for everyday luxury, seamless support, and all-day comfort.",
  telephone: "+91 7510441075",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91 7510441075",
    contactType: "customer service",
    areaServed: "IN",
  },
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
