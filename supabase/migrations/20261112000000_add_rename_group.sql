-- Lets a recipe note's owner change its name. Only the name column changes;
-- groups keeps no update policy, so direct updates stay denied by RLS.
create or replace function public.rename_group(p_group_id uuid, p_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  next_name text := trim(coalesce(p_name, ''));
  renamed public.groups;
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。' using errcode = '28000';
  end if;

  -- Same limit as the setup screen (stricter than the table check of 80).
  if char_length(next_name) not between 1 and 50 then
    raise exception 'レシピノートの名前は1〜50文字にしてください。' using errcode = '22023';
  end if;

  -- Also false for non-members and notes that do not exist.
  if not public.is_group_owner(p_group_id, auth.uid()) then
    raise exception 'レシピノートのオーナーだけが名前を変更できます。' using errcode = '42501';
  end if;

  update public.groups
  set name = next_name
  where id = p_group_id
  returning * into renamed;

  return renamed;
end;
$$;

revoke execute on function public.rename_group(uuid, text) from public, anon;
grant execute on function public.rename_group(uuid, text) to authenticated;
