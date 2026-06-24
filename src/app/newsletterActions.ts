'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email/mailer'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; error?: string; alreadySubscribed?: boolean }> {
  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`newsletter:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Demasiados pedidos. Tenta novamente mais tarde.' }
  }

  const value = (email ?? '').trim().toLowerCase()

  if (!value || !EMAIL_RE.test(value)) {
    return { success: false, error: 'Email inválido' }
  }

  const supabase = await createClient()

  // Generate the token server-side: the RLS select policy is admin-only,
  // so we can't read the row back after inserting as anon. Knowing the
  // token up front lets us send the welcome email with a working
  // unsubscribe link.
  const unsubscribe_token = crypto.randomUUID()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: value,
      consent_at: new Date().toISOString(),
      unsubscribe_token,
    })

  if (error) {
    // 23505 = unique_violation (already subscribed)
    if (error.code === '23505') {
      return { success: true, alreadySubscribed: true }
    }
    console.error('Error subscribing to newsletter:', error)
    return { success: false, error: 'Não foi possível subscrever' }
  }

  // First-time subscriber: send the welcome email (best-effort, never blocks).
  await sendWelcomeEmail({ email: value, unsubscribe_token })

  return { success: true }
}
