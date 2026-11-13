-- Leaving a recipe note, and owners removing members. group_members keeps no
-- delete policy, so direct deletes stay denied by RLS; these RPCs check the
-- caller first.

-- Leaves a recipe note. An owner can leave only when no other member is left,
-- and then the note is deleted with its recipes (on delete cascade).
-- Returns 'left' or 'deleted'.
create or replace function public.leave_group(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。' using errcode = '28000';
  end if;

  -- Lock the note so a join at the same moment cannot slip in between the
  -- check below and the delete. Adding a member takes a key share lock on
  -- this row through the foreign key, so it waits here.
  perform 1 from public.groups where id = p_group_id for update;

  if not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'このレシピノートのメンバーではありません。' using errcode = '42501';
  end if;

  if public.is_group_owner(p_group_id, auth.uid()) then
    if exists (
      select 1 from public.group_members
      where group_id = p_group_id and user_id <> auth.uid()
    ) then
      raise exception 'ほかのメンバーがいる間、オーナーは退出できません。' using errcode = '55000';
    end if;

    delete from public.groups where id = p_group_id;
    return 'deleted';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = auth.uid();
  return 'left';
end;
$$;

-- Removes another member from a recipe note. Owners only. Their recipes stay.
create or replace function public.remove_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'ログインが必要です。' using errcode = '28000';
  end if;

  -- Also false for non-members and notes that do not exist.
  if not public.is_group_owner(p_group_id, auth.uid()) then
    raise exception 'レシピノートのオーナーだけがメンバーを外せます。' using errcode = '42501';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'オーナー自身は外せません。' using errcode = '22023';
  end if;

  if not public.is_group_member(p_group_id, p_user_id) then
    raise exception 'このメンバーはレシピノートにいません。' using errcode = '22023';
  end if;

  delete from public.group_members
  where group_id = p_group_id and user_id = p_user_id;
end;
$$;

revoke execute on function public.leave_group(uuid) from public, anon;
grant execute on function public.leave_group(uuid) to authenticated;
revoke execute on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
