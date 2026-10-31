alter table public.knowledge_items
add column if not exists category text;

create index if not exists idx_knowledge_items_category
on public.knowledge_items(category);