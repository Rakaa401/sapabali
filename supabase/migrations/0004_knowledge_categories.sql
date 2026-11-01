
begin;

create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_knowledge_categories_name
on public.knowledge_categories (lower(name));

create index if not exists idx_knowledge_categories_created_at
on public.knowledge_categories (created_at desc);

insert into public.knowledge_categories (name, slug)
select
  distinct btrim(category),
  regexp_replace(
    lower(btrim(category)),
    '[^a-z0-9]+',
    '-',
    'g'
  ) || '-' || substr(md5(lower(btrim(category))), 1, 6)
from public.knowledge_items
where category is not null
  and btrim(category) <> ''
on conflict do nothing;

create trigger set_knowledge_categories_updated_at
before update on public.knowledge_categories
for each row execute function public.set_updated_at();

alter table public.knowledge_categories enable row level security;

drop policy if exists "Public can read knowledge categories"
on public.knowledge_categories;

create policy "Public can read knowledge categories"
on public.knowledge_categories
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert knowledge categories"
on public.knowledge_categories;

create policy "Admins can insert knowledge categories"
on public.knowledge_categories
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Admins can update knowledge categories"
on public.knowledge_categories;

create policy "Admins can update knowledge categories"
on public.knowledge_categories
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete knowledge categories"
on public.knowledge_categories;

create policy "Admins can delete knowledge categories"
on public.knowledge_categories
for delete
to authenticated
using ((select public.is_admin()));

grant select on public.knowledge_categories to anon, authenticated;
grant insert, update, delete on public.knowledge_categories to authenticated;

commit;
