create or replace function public.replace_knowledge_chunks(
  p_knowledge_item_id uuid,
  p_chunks jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'You do not have permission to index knowledge.';
  end if;

  if jsonb_typeof(p_chunks) <> 'array' then
    raise exception 'Chunks must be a JSON array.';
  end if;

  if not exists (
    select 1
    from public.knowledge_items
    where id = p_knowledge_item_id
  ) then
    raise exception 'Knowledge item not found.';
  end if;

  delete from public.knowledge_chunks
  where knowledge_item_id = p_knowledge_item_id;

  insert into public.knowledge_chunks (
    knowledge_item_id,
    chunk_index,
    content,
    embedding,
    metadata
  )
  select
    p_knowledge_item_id,
    (chunk->>'chunk_index')::integer,
    chunk->>'content',
    (chunk->>'embedding')::extensions.vector,
    coalesce(chunk->'metadata', '{}'::jsonb)
  from jsonb_array_elements(p_chunks) as chunk;
end;
$$;

revoke all on function public.replace_knowledge_chunks(uuid, jsonb) from public;
grant execute on function public.replace_knowledge_chunks(uuid, jsonb) to authenticated;