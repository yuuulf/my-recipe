-- Search keywords match literally: escape the LIKE wildcards % and _ and the
-- escape character itself, so "50%" or "a_b" no longer match other text.
-- Arguments, return type, security invoker and grants stay as they were.
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
  with pattern as (
    select '%'
      || replace(replace(replace(coalesce(p_query, ''), '\', '\\'), '%', '\%'), '_', '\_')
      || '%' as value
  )
  select r.*
  from public.recipes r, pattern p
  where r.group_id = p_group_id
    and (
      trim(coalesce(p_query, '')) = ''
      or r.title ilike p.value escape '\'
      or coalesce(r.description, '') ilike p.value escape '\'
      or coalesce(r.memo, '') ilike p.value escape '\'
      or exists (select 1 from unnest(r.ingredients) ingredient where ingredient ilike p.value escape '\')
      or exists (select 1 from unnest(r.tags) tag where tag ilike p.value escape '\')
    )
  order by r.updated_at desc;
$$;
