-- Hardens the admin-only RLS so that ANONYMOUS authenticated sessions
-- (signInAnonymously, used for comment ownership) can no longer read or write
-- admin data directly through PostgREST with the public anon key.
--
-- Root cause: enabling "Allow anonymous sign-ins" made the `authenticated`
-- role include every visitor. The policies below were written as
-- `to authenticated using(true)`, which is why anyone could dump the newsletter
-- (PII) or delete posts by hitting /rest/v1 directly. We now require a
-- NON-anonymous account, matching the pattern migration 0004 used for comments.
--
-- Admin detection: coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
-- (anonymous users carry is_anonymous = true; a real login carries false).
--
-- NOTE: this migration is RLS-ONLY on purpose. The orphan bs_*/shop_* function
-- cleanup lives in 0007 because those functions are referenced by leftover
-- storage.objects policies — dropping them here would abort the whole
-- transaction (and with it this security fix). Keep the two concerns separate.

-- ---------------------------------------------------------------------------
-- posts: keep public read of published rows; writes require a real admin.
-- ---------------------------------------------------------------------------
drop policy if exists "posts_auth_all" on public.posts;
create policy "posts_admin_all"
  on public.posts for all
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers: public still inserts (subscribe); only a real admin
-- may read / update / delete. This closes the PII leak.
-- ---------------------------------------------------------------------------
drop policy if exists "newsletter_auth_select" on public.newsletter_subscribers;
create policy "newsletter_admin_select"
  on public.newsletter_subscribers for select
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "newsletter_auth_modify" on public.newsletter_subscribers;
create policy "newsletter_admin_modify"
  on public.newsletter_subscribers for all
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ---------------------------------------------------------------------------
-- suggestions: public still inserts; only a real admin may read / moderate.
-- ---------------------------------------------------------------------------
drop policy if exists "suggestions_auth_all" on public.suggestions;
create policy "suggestions_admin_all"
  on public.suggestions for all
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ---------------------------------------------------------------------------
-- BookReview: writable by any anonymous session in production. Its RLS was
-- created in the dashboard with legacy policy names ("Só autenticados podem
-- inserir/editar/apagar", using(true)), so instead of guessing names we ADD
-- RESTRICTIVE write clamps that AND with whatever exists: an anonymous session
-- can never insert/update/delete, while the public SELECT ("Leitura") and the
-- admin's own writes still work.
-- ---------------------------------------------------------------------------
alter table public."BookReview" enable row level security;

drop policy if exists "bookreview_block_anon_insert" on public."BookReview";
create policy "bookreview_block_anon_insert"
  on public."BookReview" as restrictive for insert
  to authenticated
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "bookreview_block_anon_update" on public."BookReview";
create policy "bookreview_block_anon_update"
  on public."BookReview" as restrictive for update
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "bookreview_block_anon_delete" on public."BookReview";
create policy "bookreview_block_anon_delete"
  on public."BookReview" as restrictive for delete
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ---------------------------------------------------------------------------
-- Perf: wrap auth.uid()/auth.jwt() in a scalar subselect so Postgres evaluates
-- it ONCE per query instead of once per row (advisor 0003 auth_rls_initplan).
-- Behaviour is identical to migration 0004.
-- ---------------------------------------------------------------------------
drop policy if exists "comment_insert_own" on public.book_comments;
create policy "comment_insert_own"
  on public.book_comments
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "comment_update_own_or_admin" on public.book_comments;
create policy "comment_update_own_or_admin"
  on public.book_comments
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  )
  with check (
    user_id = (select auth.uid())
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists "comment_delete_own_or_admin" on public.book_comments;
create policy "comment_delete_own_or_admin"
  on public.book_comments
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
  );
