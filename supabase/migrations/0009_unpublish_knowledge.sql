create or replace function public.unpublish_knowledge(
  p_knowledge_item_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'You do not have permission to unpublish knowledge.';
  end if;

  update public.knowledge_items
  set
    status = 'unpublished',
    indexing_status = 'pending'
  where id = p_knowledge_item_id;

  if not found then
    raise exception 'Knowledge item not found.';
  end if;

  delete from public.knowledge_chunks
  where knowledge_item_id = p_knowledge_item_id;
end;
$$;

revoke all on function public.unpublish_knowledge(uuid) from public;
grant execute on function public.unpublish_knowledge(uuid) to authenticated;