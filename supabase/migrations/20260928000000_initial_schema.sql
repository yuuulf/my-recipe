create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  invite_token uuid not null unique default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  tags text[] not null default '{}',
  cooking_time_minutes integer check (cooking_time_minutes is null or cooking_time_minutes > 0),
  servings integer check (servings is null or servings > 0),
  source_url text,
  memo text,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_group_updated_idx
  on public.recipes (group_id, updated_at desc);

create index if not exists groups_invite_token_idx
  on public.groups (invite_token);

create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
  );
$$;

create or replace function public.is_group_owner(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.role = 'owner'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.recipes enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.group_members gm
      where gm.user_id = profiles.id
        and public.is_group_member(gm.group_id, auth.uid())
    )
  );

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated
  using (public.is_group_member(id, auth.uid()));

drop policy if exists groups_insert on public.groups;
create policy groups_insert on public.groups
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists group_members_select on public.group_members;
create policy group_members_select on public.group_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
  );

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_group_member(group_id, auth.uid())
  );

drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes
  for select to authenticated
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists recipes_insert on public.recipes;
create policy recipes_insert on public.recipes
  for insert to authenticated
  with check (
    public.is_group_member(group_id, auth.uid())
    and created_by = auth.uid()
  );

drop policy if exists recipes_update on public.recipes;
create policy recipes_update on public.recipes
  for update to authenticated
  using (public.is_group_member(group_id, auth.uid()))
  with check (
    public.is_group_member(group_id, auth.uid())
    and updated_by = auth.uid()
  );

drop policy if exists recipes_delete on public.recipes;
create policy recipes_delete on public.recipes
  for delete to authenticated
  using (public.is_group_member(group_id, auth.uid()));

create or replace function public.create_group(p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  created_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  insert into public.groups (name, created_by)
  values (trim(p_name), auth.uid())
  returning * into created_group;

  insert into public.group_members (group_id, user_id, role)
  values (created_group.id, auth.uid(), 'owner');

  return created_group;
end;
$$;

create or replace function public.join_group(p_invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  select * into target_group
  from public.groups
  where invite_token = p_invite_token;

  if target_group.id is null then
    raise exception '招待リンクが見つかりません。';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group.id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return target_group.id;
end;
$$;

create or replace function public.get_group_by_invite_token(p_invite_token uuid)
returns public.groups
language sql
stable
security definer
set search_path = public
as $$
  select g.*
  from public.groups g
  where g.invite_token = p_invite_token;
$$;

create or replace function public.search_recipes(
  p_group_id uuid,
  p_query text
)
returns setof public.recipes
language sql
stable
security invoker
set search_path = public
as $$
  select r.*
  from public.recipes r
  where r.group_id = p_group_id
    and (
      trim(coalesce(p_query, '')) = ''
      or r.title ilike '%' || p_query || '%'
      or coalesce(r.description, '') ilike '%' || p_query || '%'
      or coalesce(r.memo, '') ilike '%' || p_query || '%'
      or exists (select 1 from unnest(r.ingredients) ingredient where ingredient ilike '%' || p_query || '%')
      or exists (select 1 from unnest(r.tags) tag where tag ilike '%' || p_query || '%')
    )
  order by r.updated_at desc;
$$;

grant execute on function public.get_group_by_invite_token(uuid) to anon, authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.search_recipes(uuid, text) to authenticated;
