'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimitDistributed, getRequestIp } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import type { BookComment, CreateCommentInput } from '@/interface/book'
import type { SupabaseClient } from '@supabase/supabase-js'

// Decides whether the current request may modify a given comment.
// - A real (non-anonymous) account is the admin (Tatiana) -> can moderate all.
// - An anonymous visitor may only touch comments owned by their session.
// - With no session (anonymous sign-ins not enabled yet) we fall back to the
//   legacy fingerprint match so editing keeps working until the migration lands.
// The database RLS policies (migration 0004) enforce the same rules, so this is
// defence-in-depth, not the only gate.
async function canModifyComment(
  supabase: SupabaseClient,
  existing: { user_id: string | null; user_identifier: string },
  legacyIdentifier: string
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    if (user.is_anonymous === false) return true // admin
    return !!existing.user_id && existing.user_id === user.id
  }

  return existing.user_identifier === legacyIdentifier
}

export async function getBookComments(bookId: number): Promise<BookComment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('book_comments')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data || []
}

export async function createBookComment(
  input: CreateCommentInput & { user_identifier: string; turnstileToken?: string }
): Promise<{ success: boolean; error?: string; data?: BookComment }> {
  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`comment:create:${ip}`, 10, 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Demasiados pedidos. Tenta novamente mais tarde.' }
  }

  // CAPTCHA — verified only when Turnstile is configured (otherwise skipped).
  const captchaOk = await verifyTurnstile(input.turnstileToken ?? null, ip)
  if (!captchaOk) {
    return { success: false, error: 'Verificação anti-spam falhou. Tenta novamente.' }
  }

  const supabase = await createClient()

  if (!input.book_id || !input.user_identifier || !input.comment_text) {
    return { success: false, error: 'Missing required fields' }
  }

  if (input.comment_text.length > 250) {
    return { success: false, error: 'Comment exceeds 250 character limit' }
  }

  try {
    // Tie the comment to the (anonymous) auth user so ownership can be
    // enforced by RLS instead of the forgeable client identifier.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // One comment per book per session (or per fingerprint as a fallback).
    const dedupe = supabase
      .from('book_comments')
      .select('id')
      .eq('book_id', input.book_id)
    const { data: existingComment, error: checkError } = await (user
      ? dedupe.eq('user_id', user.id)
      : dedupe.eq('user_identifier', input.user_identifier)
    ).single()

    if (existingComment) {
      return { success: false, error: 'You have already commented on this book' }
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing comment:', checkError)
      return { success: false, error: 'Failed to validate comment' }
    }

    const { data, error } = await supabase
      .from('book_comments')
      .insert([
        {
          book_id: input.book_id,
          user_identifier: input.user_identifier,
          user_id: user?.id ?? null,
          comment_text: input.comment_text,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return { success: false, error: 'Failed to create comment' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in createBookComment:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function updateBookComment(
  commentId: string,
  input: { user_identifier: string; comment_text: string }
): Promise<{ success: boolean; error?: string; data?: BookComment }> {
  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`comment:update:${ip}`, 20, 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Demasiados pedidos. Tenta novamente mais tarde.' }
  }

  const supabase = await createClient()

  if (!commentId || !input.user_identifier || !input.comment_text) {
    return { success: false, error: 'Missing required fields' }
  }

  if (input.comment_text.length > 250) {
    return { success: false, error: 'Comment exceeds 250 character limit' }
  }

  try {
    // First check if the comment belongs to the user
    const { data: existingComment, error: checkError } = await supabase
      .from('book_comments')
      .select('id, user_id, user_identifier')
      .eq('id', commentId)
      .single()

    if (checkError || !existingComment) {
      console.error('Error finding comment:', checkError)
      return { success: false, error: 'Comment not found' }
    }

    if (!(await canModifyComment(supabase, existingComment, input.user_identifier))) {
      return { success: false, error: 'Unauthorized: You do not own this comment' }
    }

    // Update the comment
    const { data, error } = await supabase
      .from('book_comments')
      .update({
        comment_text: input.comment_text,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return { success: false, error: 'Failed to update comment' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in updateBookComment:', error)
    return { success: false, error: 'Internal server error' }
  }
}

export async function deleteBookCommentByUser(
  commentId: string,
  user_identifier: string
): Promise<{ success: boolean; error?: string }> {
  const ip = await getRequestIp()
  const rl = await rateLimitDistributed(`comment:delete:${ip}`, 20, 60 * 1000)
  if (!rl.allowed) {
    return { success: false, error: 'Demasiados pedidos. Tenta novamente mais tarde.' }
  }

  const supabase = await createClient()

  if (!commentId || !user_identifier) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    // First check if the comment belongs to the user
    const { data: existingComment, error: checkError } = await supabase
      .from('book_comments')
      .select('id, user_id, user_identifier')
      .eq('id', commentId)
      .single()

    if (checkError || !existingComment) {
      console.error('Error finding comment:', checkError)
      return { success: false, error: 'Comment not found' }
    }

    if (!(await canModifyComment(supabase, existingComment, user_identifier))) {
      return { success: false, error: 'Unauthorized: You do not own this comment' }
    }

    // Delete the comment
    const { error } = await supabase
      .from('book_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return { success: false, error: 'Failed to delete comment' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteBookCommentByUser:', error)
    return { success: false, error: 'Internal server error' }
  }
}
