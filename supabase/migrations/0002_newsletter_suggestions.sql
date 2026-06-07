-- Newsletter subscribers + reader suggestions
-- Follows the RLS pattern from 0001_create_posts.sql

-- =========================================================
-- newsletter_subscribers
-- Emails are PII: public can INSERT (subscribe) but NOT read.
-- Only authenticated admin can list/delete.
-- =========================================================
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed boolean not null default true,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_confirmed_idx
  on public.newsletter_subscribers (confirmed);

alter table public.newsletter_subscribers enable row level security;

-- Public can subscribe (insert only)
drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Only admin (authenticated) can read / update / delete
drop policy if exists "newsletter_auth_select" on public.newsletter_subscribers;
create policy "newsletter_auth_select"
  on public.newsletter_subscribers for select
  to authenticated
  using (true);

drop policy if exists "newsletter_auth_modify" on public.newsletter_subscribers;
create policy "newsletter_auth_modify"
  on public.newsletter_subscribers for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- suggestions
-- Anonymous reader suggestions (same shape as book_comments).
-- Public insert, admin-only read/moderate.
-- =========================================================
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  suggestion_text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists suggestions_is_read_idx
  on public.suggestions (is_read, created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "suggestions_public_insert" on public.suggestions;
create policy "suggestions_public_insert"
  on public.suggestions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "suggestions_auth_all" on public.suggestions;
create policy "suggestions_auth_all"
  on public.suggestions for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- One-click unsubscribe by token (no auth).
-- SECURITY DEFINER so an anonymous visitor can remove ONLY the row
-- matching their token — it cannot read or delete anything else.
-- =========================================================
create or replace function public.newsletter_unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.newsletter_subscribers
    where unsubscribe_token = p_token;
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.newsletter_unsubscribe(uuid) from public;
grant execute on function public.newsletter_unsubscribe(uuid) to anon, authenticated;

-- =========================================================
-- Anti re-send guard for the auto-notify newsletter (Phase B)
-- =========================================================
alter table public.posts
  add column if not exists notified_at timestamptz;

alter table public."BookReview"
  add column if not exists notified_at timestamptz;
