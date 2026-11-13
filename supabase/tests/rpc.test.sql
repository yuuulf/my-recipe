-- RPCs for recipe notes: create, join by invite, rename, look up an invite.
-- Runs in a transaction that is rolled back, with its own data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Alice owns note A. Bob and Carol belong to no note yet.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'alice@example.test', '{"display_name": "Alice"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'bob@example.test', '{"display_name": "Bob"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-00000000000c', 'authenticated', 'authenticated', 'carol@example.test', '{"display_name": "Carol"}', '', '', '', '');

insert into public.groups (id, name, invite_token, created_by) values
  ('20000000-0000-4000-8000-0000000000a0', 'note A', '20000000-0000-4000-8000-0000000000a9', '20000000-0000-4000-8000-00000000000a');
insert into public.group_members (group_id, user_id, role) values
  ('20000000-0000-4000-8000-0000000000a0', '20000000-0000-4000-8000-00000000000a', 'owner');

set local role authenticated;

-- create_group, as Carol
select set_config('request.jwt.claims', '{"sub": "20000000-0000-4000-8000-00000000000c", "role": "authenticated"}', true);
select is((public.create_group('  キャロルのノート  ')).name, 'キャロルのノート', 'create_group creates a note with the trimmed name');
select is(
  (select gm.role from public.group_members gm join public.groups g on g.id = gm.group_id where g.name = 'キャロルのノート' and gm.user_id = '20000000-0000-4000-8000-00000000000c'),
  'owner', 'the creator becomes its owner'
);
select is((public.create_group(repeat('あ', 50))).name, repeat('あ', 50), 'a 50-character name is accepted');
select throws_ok($$select public.create_group('   ')$$, '22023', 'レシピノートの名前は1〜50文字にしてください。', 'an empty name is rejected');
select throws_ok($$select public.create_group(repeat('あ', 51))$$, '22023', 'レシピノートの名前は1〜50文字にしてください。', 'a 51-character name is rejected');

-- join_group, as Bob
select set_config('request.jwt.claims', '{"sub": "20000000-0000-4000-8000-00000000000b", "role": "authenticated"}', true);
select is(public.join_group('20000000-0000-4000-8000-0000000000a9'), '20000000-0000-4000-8000-0000000000a0'::uuid, 'join_group returns the id of the joined note');
select is(
  (select role from public.group_members where group_id = '20000000-0000-4000-8000-0000000000a0' and user_id = '20000000-0000-4000-8000-00000000000b'),
  'member', 'the invited user becomes a member'
);
select is(public.join_group('20000000-0000-4000-8000-0000000000a9'), '20000000-0000-4000-8000-0000000000a0'::uuid, 'joining again returns the same id');
select is(
  (select count(*)::int from public.group_members where group_id = '20000000-0000-4000-8000-0000000000a0' and user_id = '20000000-0000-4000-8000-00000000000b'),
  1, 'joining again adds no second membership'
);
select throws_ok($$select public.join_group('20000000-0000-4000-8000-0000000000ff')$$, 'P0001', '招待リンクが見つかりません。', 'an unknown invite token is rejected');

-- rename_group
select throws_ok($$select public.rename_group('20000000-0000-4000-8000-0000000000a0', 'ボブの名前')$$, '42501', 'レシピノートのオーナーだけが名前を変更できます。', 'a member who is not the owner cannot rename');
select set_config('request.jwt.claims', '{"sub": "20000000-0000-4000-8000-00000000000c", "role": "authenticated"}', true);
select throws_ok($$select public.rename_group('20000000-0000-4000-8000-0000000000a0', 'キャロルの名前')$$, '42501', 'レシピノートのオーナーだけが名前を変更できます。', 'a non-member cannot rename');
select set_config('request.jwt.claims', '{"sub": "20000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
select is((public.rename_group('20000000-0000-4000-8000-0000000000a0', '  アリスのノート  ')).name, 'アリスのノート', 'the owner can rename, and the name is trimmed');
select throws_ok($$select public.rename_group('20000000-0000-4000-8000-0000000000a0', repeat('あ', 51))$$, '22023', 'レシピノートの名前は1〜50文字にしてください。', 'a 51-character name is rejected');
select throws_ok($$select public.rename_group('20000000-0000-4000-8000-0000000000ff', '存在しない')$$, '42501', 'レシピノートのオーナーだけが名前を変更できます。', 'a note that does not exist cannot be renamed');

-- Signed out
select set_config('request.jwt.claims', '{"role": "authenticated"}', true);
select throws_ok($$select public.create_group('名前')$$, 'P0001', 'ログインが必要です。', 'create_group needs a signed-in user');
select throws_ok($$select public.join_group('20000000-0000-4000-8000-0000000000a9')$$, 'P0001', 'ログインが必要です。', 'join_group needs a signed-in user');

-- get_group_by_invite_token works before signing in (the invite page).
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((public.get_group_by_invite_token('20000000-0000-4000-8000-0000000000a9')).name, 'アリスのノート', 'an invite token finds its note, even when signed out');
-- An unknown token returns a row of nulls; the app treats a row without an id as not found.
select is((public.get_group_by_invite_token('20000000-0000-4000-8000-0000000000ff')).id, null, 'an unknown invite token finds no note');
select throws_ok($$select public.rename_group('20000000-0000-4000-8000-0000000000a0', '名前')$$, '42501', null, 'a signed-out visitor cannot call rename_group');

select * from finish();
rollback;
