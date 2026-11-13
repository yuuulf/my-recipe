-- Row level security: a user sees and changes only the recipe notes they
-- belong to. Runs in a transaction that is rolled back, with its own data.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Alice belongs to note A. Bob owns note B, which Alice does not belong to.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'alice@example.test', '{"display_name": "Alice"}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'bob@example.test', '{"display_name": "Bob"}', '', '', '', '');

insert into public.groups (id, name, created_by) values
  ('10000000-0000-4000-8000-0000000000a0', 'note A', '10000000-0000-4000-8000-00000000000a'),
  ('10000000-0000-4000-8000-0000000000b0', 'note B', '10000000-0000-4000-8000-00000000000b');

insert into public.group_members (group_id, user_id, role) values
  ('10000000-0000-4000-8000-0000000000a0', '10000000-0000-4000-8000-00000000000a', 'owner'),
  ('10000000-0000-4000-8000-0000000000b0', '10000000-0000-4000-8000-00000000000b', 'owner');

insert into public.recipes (id, group_id, title, ingredients, steps, created_by) values
  ('10000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a0', 'recipe A', array['a'], array['a'], '10000000-0000-4000-8000-00000000000a'),
  ('10000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000b0', 'recipe B', array['b'], array['b'], '10000000-0000-4000-8000-00000000000b');

-- Act as Alice.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "10000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);

-- Reading
select is((select count(*)::int from public.recipes where id = '10000000-0000-4000-8000-0000000000a1'), 1, 'a member sees the recipes of her note');
select is((select count(*)::int from public.recipes where id = '10000000-0000-4000-8000-0000000000b1'), 0, 'she does not see recipes of another note');
select is((select count(*)::int from public.groups where id = '10000000-0000-4000-8000-0000000000b0'), 0, 'she does not see another note');
select is((select count(*)::int from public.group_members where group_id = '10000000-0000-4000-8000-0000000000b0'), 0, 'she does not see the members of another note');
select is((select count(*)::int from public.profiles where id = '10000000-0000-4000-8000-00000000000b'), 0, 'she does not see the profile of someone she shares no note with');
select is((select count(*)::int from public.profiles where id = '10000000-0000-4000-8000-00000000000a'), 1, 'she sees her own profile');

-- Writing to her own note
select lives_ok(
  $$insert into public.recipes (group_id, title, ingredients, steps, created_by) values ('10000000-0000-4000-8000-0000000000a0', 'new', array['x'], array['x'], '10000000-0000-4000-8000-00000000000a')$$,
  'she can add a recipe to her note'
);
select throws_ok(
  $$insert into public.recipes (group_id, title, ingredients, steps, created_by) values ('10000000-0000-4000-8000-0000000000a0', 'forged', array['x'], array['x'], '10000000-0000-4000-8000-00000000000b')$$,
  '42501', null, 'she cannot add a recipe in someone else''s name'
);
select lives_ok(
  $$update public.recipes set title = 'renamed', updated_by = '10000000-0000-4000-8000-00000000000a' where id = '10000000-0000-4000-8000-0000000000a1'$$,
  'she can update a recipe of her note'
);
select throws_ok(
  $$update public.recipes set title = 'forged', updated_by = '10000000-0000-4000-8000-00000000000b' where id = '10000000-0000-4000-8000-0000000000a1'$$,
  '42501', null, 'she cannot update a recipe in someone else''s name'
);

-- Writing to another note
select throws_ok(
  $$insert into public.recipes (group_id, title, ingredients, steps, created_by) values ('10000000-0000-4000-8000-0000000000b0', 'intruder', array['x'], array['x'], '10000000-0000-4000-8000-00000000000a')$$,
  '42501', null, 'she cannot add a recipe to another note'
);
update public.recipes set title = 'hacked', updated_by = '10000000-0000-4000-8000-00000000000a' where id = '10000000-0000-4000-8000-0000000000b1';
delete from public.recipes where id = '10000000-0000-4000-8000-0000000000b1';
select throws_ok(
  $$insert into public.group_members (group_id, user_id, role) values ('10000000-0000-4000-8000-0000000000b0', '10000000-0000-4000-8000-00000000000a', 'member')$$,
  '42501', null, 'she cannot add herself to another note without the invite'
);
select throws_ok(
  $$insert into public.groups (name, created_by) values ('forged', '10000000-0000-4000-8000-00000000000b')$$,
  '42501', null, 'she cannot create a note in someone else''s name'
);
update public.groups set name = 'renamed directly' where id = '10000000-0000-4000-8000-0000000000a0';
update public.group_members set role = 'owner' where group_id = '10000000-0000-4000-8000-0000000000b0';

-- Signed out
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.recipes), 0, 'a signed-out visitor sees no recipes');
select is((select count(*)::int from public.groups), 0, 'a signed-out visitor sees no notes');

-- Check as the database owner that nothing outside her notes changed.
reset role;
select is((select title from public.recipes where id = '10000000-0000-4000-8000-0000000000b1'), 'recipe B', 'updating a recipe of another note changes nothing');
select is((select count(*)::int from public.recipes where id = '10000000-0000-4000-8000-0000000000b1'), 1, 'deleting a recipe of another note removes nothing');
select is((select name from public.groups where id = '10000000-0000-4000-8000-0000000000a0'), 'note A', 'a note cannot be renamed directly, only through rename_group');
select is((select role from public.group_members where group_id = '10000000-0000-4000-8000-0000000000b0' and user_id = '10000000-0000-4000-8000-00000000000b'), 'owner', 'members of another note are unchanged');

select * from finish();
rollback;
