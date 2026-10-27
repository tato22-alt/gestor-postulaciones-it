-- Daily usage counters that protect the free AI quota from abuse. Only the Edge Function,
-- using the service role, touches this table: RLS is enabled with no policies, and the
-- anon and authenticated roles cannot run the function.
--
-- Clients are identified by an HMAC-SHA-256 of their IP address, keyed with the project
-- secret key in the Edge Function, never the IP itself.
-- The special key '__global__' counts every request of the day.

create table if not exists public.ai_usage (
  usage_day date not null,
  client_hash text not null,
  request_count integer not null default 0,
  primary key (usage_day, client_hash)
);

alter table public.ai_usage enable row level security;

revoke all on table public.ai_usage from anon, authenticated;

-- Atomically counts one request. Returns false, without counting it, when the client or the
-- whole service already reached today's limit. Rows older than yesterday are removed.
create or replace function public.consume_ai_quota(
  p_client_hash text,
  p_client_limit integer,
  p_global_limit integer
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  today date := (now() at time zone 'utc')::date;
  client_count integer;
  global_count integer;
begin
  if p_client_hash is null or length(p_client_hash) <> 64 or p_client_hash = '__global__' then
    raise exception 'invalid client hash';
  end if;

  delete from public.ai_usage where usage_day < today - 1;

  insert into public.ai_usage (usage_day, client_hash, request_count)
  values (today, '__global__', 0), (today, p_client_hash, 0)
  on conflict (usage_day, client_hash) do nothing;

  -- Lock the global row first so concurrent requests are counted one at a time.
  select request_count into global_count
  from public.ai_usage
  where usage_day = today and client_hash = '__global__'
  for update;

  select request_count into client_count
  from public.ai_usage
  where usage_day = today and client_hash = p_client_hash
  for update;

  if global_count >= p_global_limit or client_count >= p_client_limit then
    return false;
  end if;

  update public.ai_usage
  set request_count = request_count + 1
  where usage_day = today and client_hash in ('__global__', p_client_hash);

  return true;
end;
$$;

revoke all on function public.consume_ai_quota(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(text, integer, integer) to service_role;
