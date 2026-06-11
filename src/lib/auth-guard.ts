import 'server-only'
import { createClient } from '@/lib/supabase/server'

// Defense-in-depth gate for admin-only server actions. RLS already restricts
// these tables to authenticated users, but server actions are directly
// callable endpoints, so each one should also verify the session itself
// instead of trusting that it was reached through a protected page.
export async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Não autorizado' }
  return { ok: true }
}
