-- Shared rate-limit store in Postgres so limits survive across serverless
-- instances without needing an external Redis. Called via RPC from the app's
-- rate limiter (which falls back to in-memory when this function is missing).
--
-- The counters table is RLS-enabled with no policies, so it is not readable or
-- writable through the REST API; all access goes through the SECURITY DEFINER
-- function below, which only ever increments the caller-supplied key.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

alter table public.rate_limits enable row level security;

create or replace function public.rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset timestamptz;
begin
  insert into public.rate_limits as rl (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
    set count = case when rl.reset_at <= v_now then 1 else rl.count + 1 end,
        reset_at = case
          when rl.reset_at <= v_now
            then v_now + make_interval(secs => p_window_ms / 1000.0)
          else rl.reset_at
        end
  returning rl.count, rl.reset_at into v_count, v_reset;

  -- Opportunistic cleanup of long-expired windows (~1% of calls).
  if random() < 0.01 then
    delete from public.rate_limits where rate_limits.reset_at < v_now - interval '1 day';
  end if;

  return query select v_count <= p_limit, greatest(0, p_limit - v_count), v_reset;
end;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public;
grant execute on function public.rate_limit_hit(text, integer, integer) to anon, authenticated;
