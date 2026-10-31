
create extension if not exists vector with schema extensions;

create table public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text,
  address text,
  regency text,
  latitude double precision,
  longitude double precision,
  image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations(id) on delete set null,
  title text not null,
  slug text not null unique,
  content text not null,
  source_url text,
  source_type text not null default 'manual',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  knowledge_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(768),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (knowledge_item_id, chunk_index)
);

create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin'
    check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query text not null,
  response text,
  model text,
  provider text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  latency_ms integer,
  status text not null default 'success'
    check (status in ('success', 'error')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_destinations_status
  on public.destinations(status);

create index idx_destinations_regency
  on public.destinations(regency);

create index idx_destinations_category
  on public.destinations(category);

create index idx_knowledge_items_destination
  on public.knowledge_items(destination_id);

create index idx_knowledge_items_status
  on public.knowledge_items(status);

create index idx_knowledge_chunks_item
  on public.knowledge_chunks(knowledge_item_id);

create index idx_knowledge_chunks_embedding
  on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create index idx_ai_logs_created_at
  on public.ai_logs(created_at desc);

create index idx_ai_logs_user
  on public.ai_logs(user_id);

create index idx_admin_users_role
  on public.admin_users(role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_destinations_updated_at
before update on public.destinations
for each row execute function public.set_updated_at();

create trigger set_knowledge_items_updated_at
before update on public.knowledge_items
for each row execute function public.set_updated_at();

create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();
