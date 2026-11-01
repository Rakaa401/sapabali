begin;

drop policy if exists "Public can read published knowledge"
on public.knowledge_items;

create policy "Public can read published knowledge"
on public.knowledge_items
for select
to anon, authenticated
using (
  status = 'published'
  and indexing_status = 'indexed'
  and exists (
    select 1
    from public.destinations d
    where d.id = destination_id
      and d.status = 'published'
  )
);

drop policy if exists "Public can read published chunks"
on public.knowledge_chunks;

create policy "Public can read published chunks"
on public.knowledge_chunks
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.knowledge_items k
    join public.destinations d on d.id = k.destination_id
    where k.id = knowledge_item_id
      and k.status = 'published'
      and k.indexing_status = 'indexed'
      and d.status = 'published'
  )
);

commit;