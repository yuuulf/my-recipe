-- Some auth users had no profiles row, so joining a group failed with
-- group_members_user_id_profiles_fkey. Backfill any missing profiles using the
-- same display name rule as public.handle_new_user().
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1))
from auth.users as u
where not exists (
  select 1 from public.profiles as p where p.id = u.id
)
on conflict (id) do nothing;

-- Make sure new users keep getting a profile, even where the trigger was
-- missing when they signed up.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
