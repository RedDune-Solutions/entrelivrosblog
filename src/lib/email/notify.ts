'use server'

import { createClient } from '@/lib/supabase/server'
import { sendNewContentEmail } from './resend'

interface NotifyArgs {
  table: 'posts' | 'BookReview'
  id: number
  url: string
}

/**
 * Best-effort: notifies confirmed subscribers about new content, once.
 * Guards on notified_at so editing already-published content never resends.
 * Never throws — publishing must not fail because of email problems.
 */
export async function notifyNewContent(args: NotifyArgs): Promise<void> {
  try {
    const supabase = await createClient()

    // Skip if this row was already announced.
    const { data: row } = await supabase
      .from(args.table)
      .select('notified_at')
      .eq('id', args.id)
      .single()

    if (!row || row.notified_at) return

    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .eq('confirmed', true)

    if (subscribers && subscribers.length > 0) {
      await sendNewContentEmail(subscribers, { url: args.url })
    }

    // Mark as notified even with zero subscribers, so a later subscriber
    // doesn't get backfilled with old content.
    await supabase
      .from(args.table)
      .update({ notified_at: new Date().toISOString() })
      .eq('id', args.id)
  } catch (err) {
    console.error('notifyNewContent failed:', err)
  }
}
