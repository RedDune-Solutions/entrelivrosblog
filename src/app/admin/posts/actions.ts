'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import type { PostInput } from '@/interface/post'
import { notifyNewContent } from '@/lib/email/notify'

// || (not ??) so an empty-string env var falls back to the real domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.entrelivrosblog.pt'

function slugify(str: string) {
  return str
    .normalize('NFD')
    // strip diacritic combining marks (U+0300..U+036F)
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

async function uniqueSlug(base: string, ignoreId?: number) {
  const supabase = await createClient()
  let slug = base || `post-${Date.now()}`
  let n = 1
  while (true) {
    const query = supabase.from('posts').select('id').eq('slug', slug).limit(1)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    const taken = (data ?? []).some((r) => r.id !== ignoreId)
    if (!taken) return slug
    n += 1
    slug = `${base}-${n}`
  }
}

function revalidateAll(slug?: string) {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/posts')
  if (slug) revalidatePath(`/posts/${slug}`)
}

export async function addPost(data: Omit<PostInput, 'slug' | 'publishedAt'> & { publishedAt?: string }) {
  const guard = await requireAdmin()
  if (!guard.ok) return { error: guard.error }

  const supabase = await createClient()

  const slug = await uniqueSlug(slugify(data.title))
  const payload = {
    ...data,
    slug,
    publishedAt: data.publishedAt ?? new Date().toISOString(),
  }

  const { data: inserted, error } = await supabase
    .from('posts')
    .insert(payload)
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidateAll(slug)

  if (payload.published && inserted) {
    await notifyNewContent({
      table: 'posts',
      id: inserted.id,
      url: `${SITE_URL}/posts/${slug}`,
    })
  }

  return { slug }
}

export async function updatePost(
  id: number,
  data: Omit<PostInput, 'slug' | 'publishedAt'> & { slug?: string; publishedAt?: string }
) {
  const guard = await requireAdmin()
  if (!guard.ok) return { error: guard.error }

  const supabase = await createClient()

  const slug = data.slug && data.slug.length > 0
    ? await uniqueSlug(slugify(data.slug), id)
    : await uniqueSlug(slugify(data.title), id)

  const { error } = await supabase
    .from('posts')
    .update({ ...data, slug })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidateAll(slug)

  // First time a post becomes published, announce it. notifyNewContent
  // guards on notified_at, so re-saving an already-announced post is a no-op.
  if (data.published) {
    await notifyNewContent({
      table: 'posts',
      id,
      url: `${SITE_URL}/posts/${slug}`,
    })
  }

  return { slug }
}

export async function deletePost(id: number) {
  const guard = await requireAdmin()
  if (!guard.ok) return { error: guard.error }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidateAll(existing?.slug)
}
