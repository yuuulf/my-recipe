-- group_members.user_id must reference profiles directly so PostgREST can
-- resolve the profiles(display_name) relationship used by the application.

-- Profiles are normally created by the auth user trigger. Backfill users that
-- existed before the trigger or schema was installed before adding the FK.
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users as u
on conflict (id) do nothing;

alter table public.group_members
  drop constraint if exists group_members_user_id_fkey,
  drop constraint if exists group_members_user_id_profiles_fkey;

alter table public.group_members
  add constraint group_members_user_id_profiles_fkey
  foreign key (user_id)
  references public.profiles(id)
  on delete cascade;

-- Ask PostgREST to refresh its schema cache immediately after the DDL change.
notify pgrst, 'reload schema';
