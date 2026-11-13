-- Input limits on recipes (20261113000000_add_input_limits.sql): values at the
-- limit are accepted, one over is rejected. Rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change)
values ('00000000-0000-0000-0000-000000000000', '40000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'alice@example.test', '{}', '', '', '', '');
insert into public.groups (id, name, created_by) values
  ('40000000-0000-4000-8000-0000000000a0', 'note A', '40000000-0000-4000-8000-00000000000a');

-- Inserts a recipe; every field defaults to a short valid value.
create function pg_temp.add_recipe(
  p_title text default 'title',
  p_description text default null,
  p_ingredients text[] default array['a'],
  p_steps text[] default array['a'],
  p_tags text[] default '{}',
  p_cooking_time integer default null,
  p_servings integer default null,
  p_source_url text default null,
  p_memo text default null
) returns void language sql as $$
  insert into public.recipes (group_id, title, description, ingredients, steps, tags, cooking_time_minutes, servings, source_url, memo, created_by)
  values ('40000000-0000-4000-8000-0000000000a0', p_title, p_description, p_ingredients, p_steps, p_tags, p_cooking_time, p_servings, p_source_url, p_memo, '40000000-0000-4000-8000-00000000000a')
$$;

-- n strings of the given length.
create function pg_temp.lines(n integer, len integer) returns text[] language sql as $$
  select array(select repeat('あ', len) from generate_series(1, n))
$$;

select lives_ok($$select pg_temp.add_recipe(
  p_title => repeat('あ', 100),
  p_description => repeat('あ', 500),
  p_ingredients => pg_temp.lines(50, 100),
  p_steps => pg_temp.lines(50, 500),
  p_tags => array(select 'タグ' || n || repeat('あ', 20 - char_length('タグ' || n)) from generate_series(1, 10) as n),
  p_cooking_time => 4320,
  p_servings => 100,
  p_source_url => 'https://example.com/' || repeat('a', 1980),
  p_memo => repeat('あ', 2000)
)$$, 'every field at its limit is accepted');

select throws_ok($$select pg_temp.add_recipe(p_title => repeat('あ', 101))$$, '23514', null, 'a 101-character title is rejected');
select throws_ok($$select pg_temp.add_recipe(p_description => repeat('あ', 501))$$, '23514', null, 'a 501-character description is rejected');
select throws_ok($$select pg_temp.add_recipe(p_ingredients => pg_temp.lines(51, 1))$$, '23514', null, '51 ingredient rows are rejected');
select throws_ok($$select pg_temp.add_recipe(p_ingredients => pg_temp.lines(1, 101))$$, '23514', null, 'a 101-character ingredient row is rejected');
select throws_ok($$select pg_temp.add_recipe(p_steps => pg_temp.lines(51, 1))$$, '23514', null, '51 step rows are rejected');
select throws_ok($$select pg_temp.add_recipe(p_steps => pg_temp.lines(1, 501))$$, '23514', null, 'a 501-character step row is rejected');
select throws_ok($$select pg_temp.add_recipe(p_tags => array(select 't' || n from generate_series(1, 11) as n))$$, '23514', null, '11 tags are rejected');
select throws_ok($$select pg_temp.add_recipe(p_tags => pg_temp.lines(1, 21))$$, '23514', null, 'a 21-character tag is rejected');
select throws_ok($$select pg_temp.add_recipe(p_cooking_time => 4321)$$, '23514', null, 'a cooking time of 4,321 minutes is rejected');
select throws_ok($$select pg_temp.add_recipe(p_servings => 101)$$, '23514', null, '101 servings are rejected');
select throws_ok($$select pg_temp.add_recipe(p_source_url => 'https://example.com/' || repeat('a', 1981))$$, '23514', null, 'a 2,001-character URL is rejected');
select throws_ok($$select pg_temp.add_recipe(p_source_url => 'https://')$$, '23514', null, 'a URL with nothing after the scheme is rejected');
select throws_ok($$select pg_temp.add_recipe(p_memo => repeat('あ', 2001))$$, '23514', null, 'a 2,001-character memo is rejected');

select * from finish();
rollback;
