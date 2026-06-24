import { createServerClient } from '@supabase/ssr'

// Cookie-less Supabase client for PUBLIC, read-only data (book reviews,
// published posts). Because it never touches next/headers `cookies()`, pages
// that use it are not forced into per-request dynamic rendering — they can be
// statically cached / revalidated (ISR), which is faster and hits the database
// far less often (fewer chances for a transient connection error to blank the
// page). Reads run as the `anon` role, so they only see what RLS exposes
// publicly.
export function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
