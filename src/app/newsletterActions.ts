'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'

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

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: value, consent_at: new Date().toISOString() })

  if (error) {
    // 23505 = unique_violation (already subscribed)
    if (error.code === '23505') {
      return { success: true, alreadySubscribed: true }
    }
    console.error('Error subscribing to newsletter:', error)
    return { success: false, error: 'Não foi possível subscrever' }
  }

  return { success: true }
}
