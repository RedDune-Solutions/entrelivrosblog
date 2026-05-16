'use server'

import { createClient } from '@/lib/supabase/server'
import type { BookComment, CreateCommentInput } from '@/interface/book'

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
  input: CreateCommentInput & { user_identifier: string }
): Promise<{ success: boolean; error?: string; data?: BookComment }> {
  const supabase = await createClient()

  if (!input.book_id || !input.user_identifier || !input.comment_text) {
    return { success: false, error: 'Missing required fields' }
  }

  if (input.comment_text.length > 250) {
    return { success: false, error: 'Comment exceeds 250 character limit' }
  }

  try {
    const { data: existingComment, error: checkError } = await supabase
      .from('book_comments')
      .select('id')
      .eq('book_id', input.book_id)
      .eq('user_identifier', input.user_identifier)
      .single()

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
      .select('id, user_identifier')
      .eq('id', commentId)
      .single()

    if (checkError || !existingComment) {
      console.error('Error finding comment:', checkError)
      return { success: false, error: 'Comment not found' }
    }

    // Verify the user owns this comment
    if (existingComment.user_identifier !== input.user_identifier) {
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
  const supabase = await createClient()

  if (!commentId || !user_identifier) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    // First check if the comment belongs to the user
    const { data: existingComment, error: checkError } = await supabase
      .from('book_comments')
      .select('id, user_identifier')
      .eq('id', commentId)
      .single()

    if (checkError || !existingComment) {
      console.error('Error finding comment:', checkError)
      return { success: false, error: 'Comment not found' }
    }

    // Verify the user owns this comment
    if (existingComment.user_identifier !== user_identifier) {
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
