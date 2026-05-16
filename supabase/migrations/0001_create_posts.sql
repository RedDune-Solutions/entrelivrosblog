-- Posts table: editorial content written by the author, optionally linked to a BookReview
create table if not exists public.posts (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  "coverImageUrl" text,
  "bookId" bigint references public."BookReview"(id) on delete set null,
  published boolean not null default true,
  "publishedAt" timestamptz not null default now(),
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists posts_published_idx
  on public.posts (published, "publishedAt" desc);

create index if not exists posts_bookid_idx on public.posts ("bookId");

-- updatedAt trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- RLS
alter table public.posts enable row level security;

drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read"
  on public.posts for select
  to anon, authenticated
  using (published = true);

drop policy if exists "posts_auth_all" on public.posts;
create policy "posts_auth_all"
  on public.posts for all
  to authenticated
  using (true)
  with check (true);

-- Storage bucket for post cover images
insert into storage.buckets (id, name, public)
  values ('PostCovers', 'PostCovers', true)
  on conflict (id) do nothing;

drop policy if exists "PostCovers public read" on storage.objects;
create policy "PostCovers public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'PostCovers');

drop policy if exists "PostCovers auth write" on storage.objects;
create policy "PostCovers auth write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'PostCovers');

drop policy if exists "PostCovers auth update" on storage.objects;
create policy "PostCovers auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'PostCovers');

drop policy if exists "PostCovers auth delete" on storage.objects;
create policy "PostCovers auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'PostCovers');
