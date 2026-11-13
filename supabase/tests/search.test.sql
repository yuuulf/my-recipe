-- search_recipes: keywords match literally in the title, description, memo,
-- ingredients and tags of the given note only. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'alice@example.test', '{}', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'bob@example.test', '{}', '', '', '', '');

insert into public.groups (id, name, created_by) values
  ('30000000-0000-4000-8000-0000000000a0', 'note A', '30000000-0000-4000-8000-00000000000a'),
  ('30000000-0000-4000-8000-0000000000b0', 'note B', '30000000-0000-4000-8000-00000000000b');
insert into public.group_members (group_id, user_id, role) values
  ('30000000-0000-4000-8000-0000000000a0', '30000000-0000-4000-8000-00000000000a', 'owner'),
  ('30000000-0000-4000-8000-0000000000b0', '30000000-0000-4000-8000-00000000000b', 'owner');

-- updated_at is set directly: the trigger only runs on update.
insert into public.recipes (group_id, title, description, ingredients, steps, tags, memo, created_by, updated_at) values
  ('30000000-0000-4000-8000-0000000000a0', 'カカオ70%のケーキ', null, array['チョコ'], array['湯せんで溶かす'], '{}', null, '30000000-0000-4000-8000-00000000000a', now() - interval '1 day'),
  ('30000000-0000-4000-8000-0000000000a0', 'ひじき煮', '常備菜', array['ひじき'], array['煮る'], array['作り置き_冷凍OK'], null, '30000000-0000-4000-8000-00000000000a', now() - interval '2 days'),
  ('30000000-0000-4000-8000-0000000000a0', 'BLTサンド', null, array['ベーコン', 'c:\temp'], array['はさむ'], '{}', 'パンを焼く', '30000000-0000-4000-8000-00000000000a', now() - interval '3 days'),
  ('30000000-0000-4000-8000-0000000000a0', '親子丼', 'だしの香り', array['卵', '鶏肉'], array['卵でとじる'], array['丼'], null, '30000000-0000-4000-8000-00000000000a', now() - interval '4 days'),
  ('30000000-0000-4000-8000-0000000000b0', 'ボブの70%チョコ', null, array['卵'], array['混ぜる'], '{}', null, '30000000-0000-4000-8000-00000000000b', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "30000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);

create or replace function pg_temp.titles(p_query text, p_group uuid default '30000000-0000-4000-8000-0000000000a0')
returns text[] language sql as $$
  select coalesce(array_agg(title), '{}') from public.search_recipes(p_group, p_query)
$$;

select is(pg_temp.titles(''), array['カカオ70%のケーキ', 'ひじき煮', 'BLTサンド', '親子丼'], 'an empty keyword returns every recipe of the note, newest first');
select is(pg_temp.titles('%'), array['カカオ70%のケーキ'], '% matches only text containing %');
select is(pg_temp.titles('70%'), array['カカオ70%のケーキ'], '70% matches literally');
select is(pg_temp.titles('_'), array['ひじき煮'], '_ matches only text containing _ (here a tag)');
select is(pg_temp.titles('\'), array['BLTサンド'], 'a backslash matches literally (here an ingredient)');
select is(pg_temp.titles('blt'), array['BLTサンド'], 'letter case is ignored');
select is(pg_temp.titles('だし'), array['親子丼'], 'the description is searched');
select is(pg_temp.titles('パンを'), array['BLTサンド'], 'the memo is searched');
select is(pg_temp.titles('卵'), array['親子丼'], 'ingredients are searched, and only in this note (Bob''s note also has 卵)');
select is(pg_temp.titles('湯せん'), '{}'::text[], 'steps are not searched');
select is(pg_temp.titles('70%', '30000000-0000-4000-8000-0000000000b0'), '{}'::text[], 'another note returns nothing, even when asked for by id');
select is(pg_temp.titles('丼'), array['親子丼'], 'tags and titles are searched');

select * from finish();
rollback;
