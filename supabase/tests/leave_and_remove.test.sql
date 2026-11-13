-- leave_group and remove_group_member: who may leave or remove whom, and what
-- stays behind. Runs in a transaction that is rolled back, with its own data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Note A: owner Olivia, members Mia and Noah, each with a recipe.
-- Note C: Lena alone, with a recipe. Xavier belongs to no note.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', id::uuid, 'authenticated', 'authenticated', email, '{}', '', '', '', ''
from (values
  ('50000000-0000-4000-8000-00000000000a', 'olivia@example.test'),
  ('50000000-0000-4000-8000-00000000000b', 'mia@example.test'),
  ('50000000-0000-4000-8000-00000000000c', 'noah@example.test'),
  ('50000000-0000-4000-8000-00000000000d', 'lena@example.test'),
  ('50000000-0000-4000-8000-00000000000e', 'xavier@example.test')
) as u(id, email);

insert into public.groups (id, name, invite_token, created_by) values
  ('50000000-0000-4000-8000-0000000000a0', 'note A', '50000000-0000-4000-8000-0000000000a9', '50000000-0000-4000-8000-00000000000a'),
  ('50000000-0000-4000-8000-0000000000c0', 'note C', '50000000-0000-4000-8000-0000000000c9', '50000000-0000-4000-8000-00000000000d');
insert into public.group_members (group_id, user_id, role) values
  ('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000a', 'owner'),
  ('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000b', 'member'),
  ('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000c', 'member'),
  ('50000000-0000-4000-8000-0000000000c0', '50000000-0000-4000-8000-00000000000d', 'owner');
insert into public.recipes (id, group_id, title, ingredients, steps, created_by) values
  ('50000000-0000-4000-8000-0000000000b1', '50000000-0000-4000-8000-0000000000a0', 'Mia''s recipe', array['x'], array['x'], '50000000-0000-4000-8000-00000000000b'),
  ('50000000-0000-4000-8000-0000000000c1', '50000000-0000-4000-8000-0000000000a0', 'Noah''s recipe', array['x'], array['x'], '50000000-0000-4000-8000-00000000000c'),
  ('50000000-0000-4000-8000-0000000000d1', '50000000-0000-4000-8000-0000000000c0', 'Lena''s recipe', array['x'], array['x'], '50000000-0000-4000-8000-00000000000d');

set local role authenticated;

-- Mia, a member: cannot remove anyone, can leave.
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-00000000000b", "role": "authenticated"}', true);
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000c')$$, '42501', 'レシピノートのオーナーだけがメンバーを外せます。', 'a member who is not the owner cannot remove members');
select is(public.leave_group('50000000-0000-4000-8000-0000000000a0'), 'left', 'a member can leave');
select is((select count(*)::int from public.groups where id = '50000000-0000-4000-8000-0000000000a0'), 0, 'after leaving she no longer sees the note');
select is((select count(*)::int from public.recipes where group_id = '50000000-0000-4000-8000-0000000000a0'), 0, 'after leaving she no longer sees its recipes');
select throws_ok($$select public.leave_group('50000000-0000-4000-8000-0000000000a0')$$, '42501', 'このレシピノートのメンバーではありません。', 'she cannot leave a note she no longer belongs to');

-- Olivia, the owner, while Noah is still a member.
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
select throws_ok($$select public.leave_group('50000000-0000-4000-8000-0000000000a0')$$, '55000', 'ほかのメンバーがいる間、オーナーは退出できません。', 'the owner cannot leave while other members remain');
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000a')$$, '22023', 'オーナー自身は外せません。', 'the owner cannot remove herself');
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000e')$$, '22023', 'このメンバーはレシピノートにいません。', 'someone who is not a member cannot be removed');
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000ff', '50000000-0000-4000-8000-00000000000c')$$, '42501', 'レシピノートのオーナーだけがメンバーを外せます。', 'a note that does not exist is rejected');
-- Direct deletes are still denied by RLS: nothing is removed.
delete from public.group_members where group_id = '50000000-0000-4000-8000-0000000000a0' and user_id = '50000000-0000-4000-8000-00000000000c';
select is((select count(*)::int from public.group_members where group_id = '50000000-0000-4000-8000-0000000000a0' and user_id = '50000000-0000-4000-8000-00000000000c'), 1, 'a member cannot be deleted directly, only through the RPC');
select lives_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000c')$$, 'the owner can remove a member');
select is((select count(*)::int from public.group_members where group_id = '50000000-0000-4000-8000-0000000000a0'), 1, 'only the owner is left in the note');

-- Xavier belongs to no note.
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-00000000000e", "role": "authenticated"}', true);
select throws_ok($$select public.leave_group('50000000-0000-4000-8000-0000000000a0')$$, '42501', 'このレシピノートのメンバーではありません。', 'a non-member cannot leave');
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000a')$$, '42501', 'レシピノートのオーナーだけがメンバーを外せます。', 'a non-member cannot remove the owner');

-- Lena, alone in her note: leaving deletes it.
select set_config('request.jwt.claims', '{"sub": "50000000-0000-4000-8000-00000000000d", "role": "authenticated"}', true);
select is(public.leave_group('50000000-0000-4000-8000-0000000000c0'), 'deleted', 'an owner alone in her note can leave, which deletes it');

-- Signed out
select set_config('request.jwt.claims', '{"role": "authenticated"}', true);
select throws_ok($$select public.leave_group('50000000-0000-4000-8000-0000000000a0')$$, '28000', 'ログインが必要です。', 'leave_group needs a signed-in user');
select throws_ok($$select public.remove_group_member('50000000-0000-4000-8000-0000000000a0', '50000000-0000-4000-8000-00000000000a')$$, '28000', 'ログインが必要です。', 'remove_group_member needs a signed-in user');
reset role;
set local role anon;
select throws_ok($$select public.leave_group('50000000-0000-4000-8000-0000000000a0')$$, '42501', null, 'a signed-out visitor cannot call leave_group');

-- What stays behind, checked as the database owner.
reset role;
select is((select count(*)::int from public.recipes where id in ('50000000-0000-4000-8000-0000000000b1', '50000000-0000-4000-8000-0000000000c1')), 2, 'recipes of members who left or were removed stay in the note');
select results_eq(
  $$select name, invite_token from public.groups where id = '50000000-0000-4000-8000-0000000000a0'$$,
  $$values ('note A'::text, '50000000-0000-4000-8000-0000000000a9'::uuid)$$,
  'leaving and removing do not change the note''s name or invite link'
);
select is((select count(*)::int from public.groups where id = '50000000-0000-4000-8000-0000000000c0'), 0, 'the deleted note is gone');
select is((select count(*)::int from public.recipes where group_id = '50000000-0000-4000-8000-0000000000c0'), 0, 'its recipes are gone too');

select * from finish();
rollback;
