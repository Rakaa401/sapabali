
begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where id = (select auth.uid())
      and role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.destinations enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.admin_users enable row level security;
alter table public.ai_logs enable row level security;

drop policy if exists "Public can read published destinations" on public.destinations;
create policy "Public can read published destinations"
on public.destinations
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can read all destinations" on public.destinations;
create policy "Admins can read all destinations"
on public.destinations
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert destinations" on public.destinations;
create policy "Admins can insert destinations"
on public.destinations
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update destinations" on public.destinations;
create policy "Admins can update destinations"
on public.destinations
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete destinations" on public.destinations;
create policy "Admins can delete destinations"
on public.destinations
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Public can read published knowledge" on public.knowledge_items;
create policy "Public can read published knowledge"
on public.knowledge_items
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.destinations d
    where d.id = destination_id
      and d.status = 'published'
  )
);

drop policy if exists "Admins can read all knowledge" on public.knowledge_items;
create policy "Admins can read all knowledge"
on public.knowledge_items
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert knowledge" on public.knowledge_items;
create policy "Admins can insert knowledge"
on public.knowledge_items
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update knowledge" on public.knowledge_items;
create policy "Admins can update knowledge"
on public.knowledge_items
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete knowledge" on public.knowledge_items;
create policy "Admins can delete knowledge"
on public.knowledge_items
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Public can read published chunks" on public.knowledge_chunks;
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
      and d.status = 'published'
  )
);

drop policy if exists "Admins can read all chunks" on public.knowledge_chunks;
create policy "Admins can read all chunks"
on public.knowledge_chunks
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can insert chunks" on public.knowledge_chunks;
create policy "Admins can insert chunks"
on public.knowledge_chunks
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update chunks" on public.knowledge_chunks;
create policy "Admins can update chunks"
on public.knowledge_chunks
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete chunks" on public.knowledge_chunks;
create policy "Admins can delete chunks"
on public.knowledge_chunks
for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can read admin records" on public.admin_users;
create policy "Admins can read admin records"
on public.admin_users
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can read AI logs" on public.ai_logs;
create policy "Admins can read AI logs"
on public.ai_logs
for select
to authenticated
using ((select public.is_admin()));

commit;
