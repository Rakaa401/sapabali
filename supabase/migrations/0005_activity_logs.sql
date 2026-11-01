-- 02.15 Admin Activity Logging
-- Tabel activity_logs + pencatatan otomatis lewat trigger (knowledge, destinations)
-- dan fungsi log_admin_activity() untuk aksi level aplikasi (login, logout, settings).

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete set null,
  admin_name text,   -- salinan saat kejadian, tetap ada walau admin dihapus
  admin_email text,
  action text not null check (action in (
    'admin_login', 'admin_logout',
    'knowledge_created', 'knowledge_updated', 'knowledge_deleted',
    'knowledge_published', 'knowledge_unpublished',
    'destination_created', 'destination_updated', 'destination_deleted',
    'settings_profile_updated', 'settings_password_changed'
  )),
  resource_type text not null
    check (resource_type in ('auth', 'knowledge', 'destination', 'settings')),
  resource_id uuid,        -- tanpa FK supaya log tetap ada setelah resource dihapus
  resource_label text,     -- judul/nama saat kejadian
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index idx_activity_logs_admin on public.activity_logs(admin_id);
create index idx_activity_logs_action on public.activity_logs(action);
create index idx_activity_logs_resource on public.activity_logs(resource_type, resource_id);

-- RLS: hanya admin yang boleh membaca. Tidak ada policy insert/update/delete,
-- jadi client biasa tidak bisa menulis atau mengubah log.
alter table public.activity_logs enable row level security;

create policy "Admins can read activity logs"
on public.activity_logs
for select
to authenticated
using ((select public.is_admin()));

revoke all on public.activity_logs from anon;
revoke insert, update, delete, truncate on public.activity_logs from authenticated;

-- Fungsi internal penulis log (tidak bisa dipanggil client)
create or replace function public.write_activity(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_resource_label text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_admin_id uuid;
  v_name text;
  v_email text;
begin
  if v_uid is not null then
    select a.id, a.full_name, u.email
      into v_admin_id, v_name, v_email
    from public.admin_users a
    join auth.users u on u.id = a.id
    where a.id = v_uid;
  end if;

  insert into public.activity_logs
    (admin_id, admin_name, admin_email, action, resource_type,
     resource_id, resource_label, description, metadata)
  values
    (v_admin_id, v_name, v_email, p_action, p_resource_type,
     p_resource_id, p_resource_label, p_description, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.write_activity(text, text, uuid, text, text, jsonb)
  from public, anon, authenticated;

-- Dipanggil dari server action: hanya admin, hanya aksi level aplikasi
-- (aksi knowledge/destination dicatat trigger, tidak bisa dipalsukan dari browser)
create or replace function public.log_admin_activity(
  p_action text,
  p_description text,
  p_resource_label text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Only admins can write activity logs';
  end if;

  if p_action not in ('admin_login', 'admin_logout',
                      'settings_profile_updated', 'settings_password_changed') then
    raise exception 'Action % is not allowed here', p_action;
  end if;

  perform public.write_activity(
    p_action,
    case when p_action in ('admin_login', 'admin_logout') then 'auth' else 'settings' end,
    null,
    p_resource_label,
    p_description,
    p_metadata
  );
end;
$$;

revoke all on function public.log_admin_activity(text, text, text, jsonb) from public, anon;
grant execute on function public.log_admin_activity(text, text, text, jsonb) to authenticated;

-- Trigger: knowledge_items
create or replace function public.trg_log_knowledge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed jsonb;
begin
  if tg_op = 'INSERT' then
    perform public.write_activity(
      'knowledge_created', 'knowledge', new.id, new.title,
      'Created knowledge "' || new.title || '"',
      jsonb_build_object('status', new.status, 'language', new.language, 'category', new.category));
    return new;

  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      if new.status = 'published' then
        perform public.write_activity(
          'knowledge_published', 'knowledge', new.id, new.title,
          'Published knowledge "' || new.title || '"',
          jsonb_build_object('from', old.status));
      elsif old.status = 'published' then
        perform public.write_activity(
          'knowledge_unpublished', 'knowledge', new.id, new.title,
          'Unpublished knowledge "' || new.title || '"',
          jsonb_build_object('to', new.status));
      end if;
    end if;

    -- perubahan isi (abaikan status, indexing_status, metadata, updated_at)
    select coalesce(jsonb_agg(n.key order by n.key), '[]'::jsonb)
      into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.key not in ('updated_at', 'indexing_status', 'status', 'metadata')
      and n.value is distinct from (to_jsonb(old) -> n.key);

    if jsonb_array_length(v_changed) > 0 then
      perform public.write_activity(
        'knowledge_updated', 'knowledge', new.id, new.title,
        'Updated knowledge "' || new.title || '"',
        jsonb_build_object('changed_fields', v_changed));
    end if;
    return new;

  else -- DELETE
    perform public.write_activity(
      'knowledge_deleted', 'knowledge', old.id, old.title,
      'Deleted knowledge "' || old.title || '"',
      '{}'::jsonb);
    return old;
  end if;
end;
$$;

revoke all on function public.trg_log_knowledge() from public, anon, authenticated;

create trigger log_knowledge_activity
after insert or update or delete on public.knowledge_items
for each row execute function public.trg_log_knowledge();

-- Trigger: destinations
create or replace function public.trg_log_destination()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed jsonb;
begin
  if tg_op = 'INSERT' then
    perform public.write_activity(
      'destination_created', 'destination', new.id, new.name,
      'Created destination "' || new.name || '"',
      jsonb_build_object('status', new.status));
    return new;

  elsif tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(n.key order by n.key), '[]'::jsonb)
      into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.key <> 'updated_at'
      and n.value is distinct from (to_jsonb(old) -> n.key);

    if jsonb_array_length(v_changed) > 0 then
      perform public.write_activity(
        'destination_updated', 'destination', new.id, new.name,
        'Updated destination "' || new.name || '"',
        jsonb_build_object('changed_fields', v_changed));
    end if;
    return new;

  else -- DELETE
    perform public.write_activity(
      'destination_deleted', 'destination', old.id, old.name,
      'Deleted destination "' || old.name || '"',
      '{}'::jsonb);
    return old;
  end if;
end;
$$;

revoke all on function public.trg_log_destination() from public, anon, authenticated;

create trigger log_destination_activity
after insert or update or delete on public.destinations
for each row execute function public.trg_log_destination();
