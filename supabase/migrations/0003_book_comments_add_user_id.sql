-- Ties each book comment to a real (anonymous) auth user so ownership can be
-- enforced by RLS instead of the forgeable client-side fingerprint identifier.
--
-- This migration is additive and safe to run on its own: the column is
-- nullable, existing rows keep working, and no policy changes here. The strict
-- ownership policies live in 0004 and must only be applied AFTER enabling
-- "Allow anonymous sign-ins" in the Supabase dashboard (Auth settings).

alter table public.book_comments
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists book_comments_user_id_idx
  on public.book_comments (user_id);
