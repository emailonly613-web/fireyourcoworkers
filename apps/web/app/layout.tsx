import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AnalyticsPageView } from "@/components/AnalyticsPageView";
import { PwaRegistration } from "@/components/PwaRegistration";
import "./globals.css";
import "./game.css";
import "./site-sections.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fireyourcoworkers.com"),
  title: "Fire Your Coworkers — Pack the office. Survive HR.",
  description:
    "A cinematic office-packing comedy game. Fit the team in the elevator before HR files the paperwork.",
  applicationName: "Fire Your Coworkers",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icons/app-icon.svg", type: "image/svg+xml" },
      { url: "/icons/app-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/app-icon-192.png", sizes: "192x192" }],
  },
  openGraph: {
    title: "Fire Your Coworkers",
    description: "Pack the office. Survive HR.",
    type: "website",
    url: "/",
    siteName: "Fire Your Coworkers",
    images: [
      {
        url: "/social/og-preview-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Fire Your Coworkers characters squeezed into a cinematic office elevator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fire Your Coworkers",
    description: "Pack the office. Survive HR.",
    images: ["/social/og-preview-1200x630.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111d",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AnalyticsPageView />
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
