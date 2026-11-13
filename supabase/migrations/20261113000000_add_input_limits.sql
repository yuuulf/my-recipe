-- Input limits for recipes and recipe-note names, enforced on the server too.
-- Keep the values in sync with src/features/recipes/recipeLimits.ts and
-- supabase/functions/recipe-draft/index.ts.

-- Whether an array has at most p_max_items items, each at most p_max_length
-- characters. Immutable so check constraints can use it.
create or replace function public.text_array_within(
  p_values text[],
  p_max_items integer,
  p_max_length integer
)
returns boolean
language sql
immutable
as $$
  select coalesce(cardinality(p_values), 0) <= p_max_items
    and not exists (
      select 1 from unnest(p_values) as value where char_length(value) > p_max_length
    );
$$;

-- "not valid" leaves existing rows unchecked, so recipes saved before these
-- limits do not stop the migration. New rows and updated rows must fit.
-- The original title check (1 to 160 characters) stays; this narrows it to 100.
alter table public.recipes
  add constraint recipes_title_length
    check (char_length(trim(title)) <= 100) not valid,
  add constraint recipes_description_length
    check (description is null or char_length(description) <= 500) not valid,
  add constraint recipes_ingredients_limits
    check (public.text_array_within(ingredients, 50, 100)) not valid,
  add constraint recipes_steps_limits
    check (public.text_array_within(steps, 50, 500)) not valid,
  add constraint recipes_tags_limits
    check (public.text_array_within(tags, 10, 20)) not valid,
  add constraint recipes_cooking_time_max
    check (cooking_time_minutes is null or cooking_time_minutes <= 4320) not valid,
  add constraint recipes_servings_max
    check (servings is null or servings <= 100) not valid,
  add constraint recipes_source_url_format
    check (source_url is null or (char_length(source_url) <= 2000 and source_url ~* '^https?://\S')) not valid,
  add constraint recipes_memo_length
    check (memo is null or char_length(memo) <= 2000) not valid;

-- Same as before, plus the 1 to 50 character name limit used by rename_group.
create or replace function public.create_group(p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  next_name text := trim(coalesce(p_name, ''));
  created_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。';
  end if;

  if char_length(next_name) not between 1 and 50 then
    raise exception 'レシピノートの名前は1〜50文字にしてください。' using errcode = '22023';
  end if;

  insert into public.groups (name, created_by)
  values (next_name, auth.uid())
  returning * into created_group;

  insert into public.group_members (group_id, user_id, role)
  values (created_group.id, auth.uid(), 'owner');

  return created_group;
end;
$$;
