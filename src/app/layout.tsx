import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import BackToTopButton from "@/components/BackToTopButton";
import { SITE_URL } from "@/lib/site";

// Self-hosted via next/font (no render-blocking @import, no unused Geist).
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  title: {
    default: "Entre Livros - Tatiana Felício",
    template: "%s | Entre Livros",
  },
  description:
    "Site de recomendações literárias de Tatiana Felício. Descobre novas leituras, opiniões honestas e o amor pelos livros.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Entre Livros - Tatiana Felício",
    description:
      "Site de recomendações literárias de Tatiana Felício.",
    url: siteUrl,
    siteName: "Entre Livros",
    locale: "pt_PT",
    type: "website",
    images: [
      {
        url: "/hero-books.jpg",
        width: 2048,
        height: 1152,
        alt: "Entre Livros — recomendações literárias de Tatiana Felício",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Entre Livros - Tatiana Felício",
    description:
      "Site de recomendações literárias de Tatiana Felício.",
    images: ["/hero-books.jpg"],
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Entre Livros",
  url: siteUrl,
  inLanguage: "pt-PT",
  author: {
    "@type": "Person",
    name: "Tatiana Felício",
    url: `${siteUrl}/aboutMe`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground"
        >
          Saltar para o conteúdo principal
        </a>
        <Analytics/>
        <SpeedInsights/>
        <Providers>
          {children}
          <BackToTopButton />
        </Providers>
      </body>
    </html>
  );}
