-- Locks down book_comments so the public can no longer edit or delete arbitrary
-- comments through the REST API.
--
-- PRE-REQUISITE: enable "Allow anonymous sign-ins" in the Supabase dashboard
-- (Authentication -> Sign In / Providers -> Anonymous) BEFORE applying this.
-- Without it, visitors have the `anon` role (not `authenticated`) and the
-- insert policy below would block all new comments.
--
-- Model:
--   * SELECT stays public (read-only feed of comments).
--   * INSERT/UPDATE/DELETE require an authenticated session. Anonymous visitors
--     get one via signInAnonymously(); the admin signs in with a real account.
--   * A visitor can only touch their OWN comment (user_id = auth.uid()).
--   * The admin (a non-anonymous account) can moderate everything. We detect
--     "real account" via the is_anonymous JWT claim, because anonymous users
--     also carry the `authenticated` role.

-- Drop the permissive public policies (the actual hole).
drop policy if exists "Usuario pode eliminar próprio comentário" on public.book_comments;
drop policy if exists "Comentários podem ser editados" on public.book_comments;
drop policy if exists "Qualquer um pode comentar" on public.book_comments;
-- This one allowed deletes for any `authenticated` role, which includes
-- anonymous users — replaced by the owner-or-admin policy below.
drop policy if exists "Admin pode eliminar comentários" on public.book_comments;

-- INSERT: only as yourself.
create policy "comment_insert_own"
  on public.book_comments
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: your own comment, or any comment if you are a real (non-anonymous) admin.
create policy "comment_update_own_or_admin"
  on public.book_comments
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  with check (
    user_id = auth.uid()
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- DELETE: your own comment, or any comment if you are a real (non-anonymous) admin.
create policy "comment_delete_own_or_admin"
  on public.book_comments
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- NOTE: the public read policy "Comentários são públicos para leitura" is kept.
