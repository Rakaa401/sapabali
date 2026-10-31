-- 0003: samakan knowledge_items dengan kebutuhan pipeline Phase 02
-- (category, language, source, indexing_status, status Draft/Published/Unpublished)

alter table public.knowledge_items
  add column if not exists category text,
  add column if not exists language text not null default 'id',
  add column if not exists source_name text,
  add column if not exists source_description text,
  add column if not exists indexing_status text not null default 'pending';

alter table public.knowledge_items
  add constraint knowledge_items_language_check
    check (language in ('id', 'en')),
  add constraint knowledge_items_indexing_status_check
    check (indexing_status in ('pending', 'indexing', 'indexed', 'failed', 'stale'));

-- Ganti status 'archived' menjadi 'unpublished' (sesuai 02.12)
alter table public.knowledge_items
  drop constraint if exists knowledge_items_status_check;

update public.knowledge_items
  set status = 'unpublished'
  where status = 'archived';

alter table public.knowledge_items
  add constraint knowledge_items_status_check
    check (status in ('draft', 'published', 'unpublished'));

create index if not exists idx_knowledge_items_category
  on public.knowledge_items(category);
create index if not exists idx_knowledge_items_language
  on public.knowledge_items(language);