import 'server-only'
import { createClient } from '@/lib/supabase/server'

// Defense-in-depth gate for admin-only server actions. RLS restricts these
// tables at the database layer, but server actions are directly callable
// endpoints, so each one also verifies the session itself instead of trusting
// that it was reached through a protected page.
//
// IMPORTANT: with anonymous sign-ins enabled (needed for comment ownership),
// the `authenticated` role includes ANY visitor who has signed in anonymously.
// So "has a user" is NOT enough — an admin must be a NON-anonymous account.
// If ADMIN_EMAIL is configured, the session e-mail must also match it.
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // No session, or an anonymous session → not an admin. Require is_anonymous to
  // be *exactly* false (fail closed): a real login sets it to false, so an
  // undefined/true value never passes.
  if (!user || user.is_anonymous !== false) {
    return { ok: false, error: 'Não autorizado' }
  }

  // Optional hard allowlist: only the configured admin e-mail passes.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (adminEmail && user.email?.trim().toLowerCase() !== adminEmail) {
    return { ok: false, error: 'Não autorizado' }
  }

  return { ok: true }
}
