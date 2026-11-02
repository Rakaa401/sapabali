
create or replace function public.log_ai_request(
  p_query text,
  p_response text default null,
  p_model text default null,
  p_provider text default 'gemini',
  p_prompt_tokens integer default 0,
  p_completion_tokens integer default 0,
  p_total_tokens integer default 0,
  p_latency_ms integer default null,
  p_status text default 'success',
  p_error_message text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_log_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  if p_status not in ('success', 'error') then
    raise exception 'Invalid AI log status.';
  end if;

  insert into public.ai_logs (
    user_id,
    query,
    response,
    model,
    provider,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    latency_ms,
    status,
    error_message,
    metadata
  )
  values (
    auth.uid(),
    p_query,
    p_response,
    p_model,
    p_provider,
    greatest(coalesce(p_prompt_tokens, 0), 0),
    greatest(coalesce(p_completion_tokens, 0), 0),
    greatest(coalesce(p_total_tokens, 0), 0),
    p_latency_ms,
    p_status,
    p_error_message,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into new_log_id;

  return new_log_id;
end;
$$;

revoke all on function public.log_ai_request(
  text, text, text, text, integer, integer, integer,
  integer, text, text, jsonb
) from public, anon;

grant execute on function public.log_ai_request(
  text, text, text, text, integer, integer, integer,
  integer, text, text, jsonb
) to authenticated;
