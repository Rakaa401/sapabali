-- 02.16: admin boleh mengubah nama profilnya sendiri.
-- Hanya kolom full_name yang boleh diubah, jadi admin tidak bisa menaikkan role-nya sendiri.

drop policy if exists "Admins can update own profile" on public.admin_users;
create policy "Admins can update own profile"
on public.admin_users
for update
to authenticated
using (id = (select auth.uid()) and (select public.is_admin()))
with check (id = (select auth.uid()) and (select public.is_admin()));

revoke update on public.admin_users from authenticated;
grant update (full_name) on public.admin_users to authenticated;
