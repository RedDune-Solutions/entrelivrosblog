'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimit, getRequestIp } from '@/lib/rate-limit'

const MAX_LEN = 500

export async function createSuggestion(
  text: string
): Promise<{ success: boolean; error?: string }> {
  const ip = await getRequestIp()
  const rl = rateLimit(`suggestion:${ip}`, 5, 10 * 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Demasiados pedidos. Tenta novamente mais tarde.' }
  }

  const value = (text ?? '').trim()

  if (!value) {
    return { success: false, error: 'A sugestão está vazia' }
  }

  if (value.length > MAX_LEN) {
    return { success: false, error: `A sugestão excede o limite de ${MAX_LEN} caracteres` }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('suggestions')
    .insert({ suggestion_text: value })

  if (error) {
    console.error('Error creating suggestion:', error)
    return { success: false, error: 'Não foi possível enviar a sugestão' }
  }

  return { success: true }
}
