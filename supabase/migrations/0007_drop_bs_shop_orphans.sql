-- Cleanup of orphan objects left over from the bs-portal / reddune-pos prototype
-- that once shared this Supabase project. The bs_* / shop_* tables and buckets
-- are already gone; what remains is dead cruft:
--   * storage.objects policies for buckets that no longer exist
--     (bs-attachments, shop-products, shop-lookbooks, shop-brand-logos,
--      shop-quotes-pdfs), and
--   * SECURITY DEFINER helper functions still callable by `anon` via
--     /rest/v1/rpc (flagged by the security advisor).
--
-- The functions cannot be dropped while those policies reference them, so the
-- policies go first. This is separate from 0006 so a dependency hiccup here can
-- never roll back the security-critical RLS fix.

-- 1. Drop the orphan storage policies (all target dead buckets).
drop policy if exists "bs_storage_delete_own"     on storage.objects;
drop policy if exists "bs_storage_insert"         on storage.objects;
drop policy if exists "bs_storage_read"           on storage.objects;
drop policy if exists "shop_storage_public_read"  on storage.objects;
drop policy if exists "shop_storage_quote_insert" on storage.objects;
drop policy if exists "shop_storage_quote_owner"  on storage.objects;
drop policy if exists "shop_storage_staff_upload" on storage.objects;

-- 2. Drop the orphan SECURITY DEFINER functions now that nothing references them.
drop function if exists public.bs_can_see_restricted();
drop function if exists public.bs_is_admin();
drop function if exists public.bs_is_member();
drop function if exists public.shop_is_staff();
drop function if exists public.shop_increment_views(uuid);

-- 3. Drop the duplicate never-used index on book_comments (advisor 0005).
drop index if exists public.idx_book_comments_user;
