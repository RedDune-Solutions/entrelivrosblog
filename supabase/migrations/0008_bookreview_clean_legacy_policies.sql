-- Optional tidy-up (cosmetic): removes the legacy dashboard-created BookReview
-- write policies that use `using(true)` / `with check(true)`. The security
-- advisor flags them as "RLS Policy Always True", even though the RESTRICTIVE
-- clamps from 0006 already block anonymous writes. We replace the three legacy
-- permissive policies with a single clean admin-write policy that itself
-- requires a NON-anonymous account, so:
--   * anon can never write (permissive admin policy fails + restrictive clamps),
--   * the admin (non-anonymous) keeps full write access,
--   * public SELECT ("Leitura") is untouched,
--   * the advisor warnings for these three policies clear.
--
-- Safe to run only AFTER 0006 (which added the restrictive clamps). Idempotent.

-- 1. Drop the legacy permissive write policies (the source of the warnings).
drop policy if exists "Só autenticados podem inserir" on public."BookReview";
drop policy if exists "Só autenticados podem editar"  on public."BookReview";
drop policy if exists "Só autenticados podem apagar"  on public."BookReview";

-- 2. Replace them with one clean permissive write policy for a real admin.
--    (The public "Leitura" SELECT policy stays; this covers INSERT/UPDATE/DELETE.)
drop policy if exists "bookreview_admin_write" on public."BookReview";
create policy "bookreview_admin_write"
  on public."BookReview" for all
  to authenticated
  using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- The RESTRICTIVE clamps bookreview_block_anon_{insert,update,delete} from 0006
-- are kept as defense-in-depth (they add no advisor noise).
