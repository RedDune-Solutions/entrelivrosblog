'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`login:${ip}`, 10, 10 * 60 * 1000)
  if (!rl.allowed) {
    return { error: 'Demasiadas tentativas. Tenta novamente mais tarde.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: 'Email ou password incorretos' }
  }

  redirect('/admin')
}