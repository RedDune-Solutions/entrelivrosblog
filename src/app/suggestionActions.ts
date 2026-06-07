'use server'

import { createClient } from '@/lib/supabase/server'

const MAX_LEN = 500

export async function createSuggestion(
  text: string
): Promise<{ success: boolean; error?: string }> {
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
