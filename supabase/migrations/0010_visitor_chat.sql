begin;

-- Rate limit chat pengunjung (fixed window). Tidak bisa diakses langsung dari client.
create table if not exists public.visitor_chat_rate_limits (
  key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (key, window_start)
);

alter table public.visitor_chat_rate_limits enable row level security;
revoke all on public.visitor_chat_rate_limits from anon, authenticated;

create or replace function public.check_visitor_chat_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 128 then
    raise exception 'Invalid rate limit key.';
  end if;

  if p_limit < 1 or p_limit > 100000 then
    raise exception 'Invalid rate limit.';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit window.';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.visitor_chat_rate_limits as r (key, window_start, request_count)
  values (p_key, v_window_start, 1)
  on conflict (key, window_start)
  do update set request_count = r.request_count + 1
  returning r.request_count into v_count;

  -- Bersihkan baris lama sesekali supaya tabel tidak membesar
  if random() < 0.02 then
    delete from public.visitor_chat_rate_limits
    where window_start < now() - interval '2 days';
  end if;

  return query
  select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    greatest(
      ceil(extract(epoch from (
        v_window_start + make_interval(secs => p_window_seconds) - now()
      )))::integer,
      1
    );
end;
$$;

-- Log chat pengunjung (tanpa user). Hanya dipanggil dari server dengan service role.
create or replace function public.log_visitor_chat(
  p_query text,
  p_response text default null,
  p_model text default null,
  p_prompt_tokens integer default 0,
  p_completion_tokens integer default 0,
  p_total_tokens integer default 0,
  p_latency_ms integer default null,
  p_status text default 'success',
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('success', 'error') then
    raise exception 'Invalid AI log status.';
  end if;

  insert into public.ai_logs (
    user_id, query, response, model, provider,
    prompt_tokens, completion_tokens, total_tokens,
    latency_ms, status, error_message, metadata
  )
  values (
    null,
    left(coalesce(p_query, ''), 1000),
    left(p_response, 4000),
    p_model,
    'gemini',
    greatest(coalesce(p_prompt_tokens, 0), 0),
    greatest(coalesce(p_completion_tokens, 0), 0),
    greatest(coalesce(p_total_tokens, 0), 0),
    p_latency_ms,
    p_status,
    left(p_error_message, 500),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('feature', 'visitor_chat')
  );
end;
$$;

revoke all on function public.check_visitor_chat_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.check_visitor_chat_rate_limit(text, integer, integer)
  to service_role;

revoke all on function public.log_visitor_chat(
  text, text, text, integer, integer, integer, integer, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.log_visitor_chat(
  text, text, text, integer, integer, integer, integer, text, text, jsonb
) to service_role;

commit;
