import { createClient } from './client'

// Ensures the visitor has a Supabase session (anonymous sign-in) so that
// comments can be tied to a verifiable auth.uid() and protected by RLS.
//
// Returns the user id, or null when anonymous sign-ins are not enabled on the
// project — callers degrade gracefully to the legacy fingerprint flow in that
// case. Once "Allow anonymous sign-ins" is enabled in the Supabase dashboard,
// every comment becomes owned by a real auth user and the strict RLS policies
// take effect.
export async function ensureAnonUserId(): Promise<string | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) return user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn('Anonymous sign-in unavailable:', error.message)
    return null
  }
  return data.user?.id ?? null
}
