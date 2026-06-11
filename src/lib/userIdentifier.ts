// Returns a stable but anonymous identifier for the current browser.
//
// IMPORTANT: this must NOT be derived from device/user characteristics
// (user agent, language, timezone, screen size, ...). That would be device
// fingerprinting and is personal data under GDPR/ePrivacy. Instead we use an
// opaque random id stored locally, which carries no information about the user
// and only exists to let a visitor recognise their own comment. The real
// ownership check is the Supabase session (user_id), enforced by RLS.
const STORAGE_KEY = 'elb_comment_id'

export async function generateUserIdentifier(): Promise<string> {
  if (typeof window === 'undefined') return ''

  try {
    let id = window.localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      window.localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable (private mode / blocked) — fall back to a
    // transient random id. Ownership still works via the Supabase session.
    return `c_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }
}
