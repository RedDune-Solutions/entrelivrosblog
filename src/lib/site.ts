// Single source of truth for the canonical site URL.
//
// Use || (not ??) so an EMPTY-STRING env var still falls back to the real
// domain — otherwise metadataBase, canonicals, sitemap, robots and e-mail links
// silently point at the wrong host (or `new URL("")` throws at build time).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.entrelivrosblog.pt'
