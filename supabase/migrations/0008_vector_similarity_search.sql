
create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  filter_destination_id uuid default null,
  match_threshold double precision default 0.5,
  match_count integer default 5
)
returns table (
  chunk_id uuid,
  knowledge_item_id uuid,
  destination_id uuid,
  destination_name text,
  title text,
  slug text,
  chunk_content text,
  chunk_index integer,
  chunk_metadata jsonb,
  knowledge_metadata jsonb,
  similarity double precision
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if query_embedding is null then
    raise exception 'Query embedding cannot be null.';
  end if;

  if match_threshold < 0 or match_threshold > 1 then
    raise exception 'Similarity threshold must be between 0 and 1.';
  end if;

  if match_count < 1 or match_count > 50 then
    raise exception 'Match count must be between 1 and 50.';
  end if;

  return query
  select
    c.id,
    k.id,
    k.destination_id,
    d.name,
    k.title,
    k.slug,
    c.content,
    c.chunk_index,
    c.metadata,
    k.metadata,
    (
      1 - (c.embedding OPERATOR(extensions.<=>) query_embedding)
    )::double precision
  from public.knowledge_chunks c
  join public.knowledge_items k
    on k.id = c.knowledge_item_id
  join public.destinations d
    on d.id = k.destination_id
  where
    c.embedding is not null
    and k.status = 'published'
    and k.indexing_status = 'indexed'
    and d.status = 'published'
    and (
      filter_destination_id is null
      or k.destination_id = filter_destination_id
    )
    and (
      1 - (c.embedding OPERATOR(extensions.<=>) query_embedding)
    ) >= match_threshold
  order by
    c.embedding OPERATOR(extensions.<=>) query_embedding asc
  limit match_count;
end;
$$;

revoke all on function public.match_knowledge_chunks(
  extensions.vector,
  uuid,
  double precision,
  integer
) from public;

grant execute on function public.match_knowledge_chunks(
  extensions.vector,
  uuid,
  double precision,
  integer
) to anon, authenticated;
