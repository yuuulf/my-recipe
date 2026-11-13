-- Sample data for Supabase Local. Applied by `supabase start` (first run) and
-- `supabase db reset`. Never run this against production.
--
-- After signing in with Google locally, open these invite links to join the
-- sample recipe notes:
--   http://localhost:5173/join/00000000-0000-4000-8000-000000000101  サンプルのレシピノート
--   http://localhost:5173/join/00000000-0000-4000-8000-000000000301  ゆきのノート

-- A sample owner who cannot sign in: no password, and email sign-up is disabled
-- in config.toml. The on_auth_user_created trigger creates the profile.
-- The token columns must be '' rather than NULL, or Auth fails to read the user.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'sample@example.com',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "サンプル"}',
  '',
  '',
  '',
  '',
  now(),
  now()
);

insert into public.groups (id, name, invite_token, created_by) values (
  '00000000-0000-4000-8000-000000000100',
  'サンプルのレシピノート',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001'
);

insert into public.group_members (group_id, user_id, role) values (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000001',
  'owner'
);

insert into public.recipes (
  group_id,
  title,
  description,
  ingredients,
  steps,
  tags,
  cooking_time_minutes,
  servings,
  memo,
  created_by,
  updated_by
) values
(
  '00000000-0000-4000-8000-000000000100',
  '豚の生姜焼き',
  '甘辛いタレでご飯がすすむ、定番の家庭料理。',
  array['豚ロース薄切り 300g', '玉ねぎ 1/2個', '醤油 大さじ2', 'みりん 大さじ2', 'すりおろししょうが 小さじ1'],
  array['玉ねぎを薄切りにし、調味料を混ぜ合わせる。', 'フライパンに油を熱し、豚肉を両面焼く。', '玉ねぎを加えてしんなりするまで炒める。', '合わせた調味料を加え、照りが出るまで煮からめる。'],
  array['肉', '簡単', '夕食'],
  20,
  2,
  '少し砂糖を追加してもおいしい。',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
(
  '00000000-0000-4000-8000-000000000100',
  'ふわとろ親子丼',
  'だしの香りと卵のやさしい味わい。',
  array['鶏もも肉 200g', '玉ねぎ 1/2個', '卵 2個', 'だし汁 100ml', '醤油 大さじ1'],
  array['鶏肉をひと口大、玉ねぎを薄切りにする。', '小鍋でだし汁と調味料、玉ねぎを煮る。', '鶏肉を加えて火を通し、溶き卵を回し入れる。', '半熟で火を止め、ご飯にのせる。'],
  array['鶏肉', '丼', '15分'],
  15,
  2,
  null,
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
(
  '00000000-0000-4000-8000-000000000100',
  'トマトとツナのパスタ',
  '忙しい日に作りたい、フライパンひとつのパスタ。',
  array['スパゲッティ 200g', 'カットトマト缶 1缶', 'ツナ缶 1缶', 'にんにく 1片'],
  array['にんにくをオリーブオイルで炒める。', 'トマト缶とツナを加えて煮込む。', '茹でたパスタを加えて和える。'],
  array['麺', '簡単', '平日'],
  25,
  2,
  '仕上げに粉チーズをたっぷり。',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);

-- More users, a second recipe note and recipes for checking member names,
-- switching notes and search. Like the sample owner, these users cannot sign in.
--   ゆき: a member of the sample note and the owner of ゆきのノート
--   けんた: no longer a member of any note, so his name is shown to nobody and
--           his recipe shows 「メンバー」 as its creator
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  created_at,
  updated_at
) values
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000002',
  'authenticated',
  'authenticated',
  'yuki@example.com',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "ゆき"}',
  '',
  '',
  '',
  '',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000003',
  'authenticated',
  'authenticated',
  'kenta@example.com',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "けんた"}',
  '',
  '',
  '',
  '',
  now(),
  now()
);

insert into public.groups (id, name, invite_token, created_by) values (
  '00000000-0000-4000-8000-000000000300',
  'ゆきのノート',
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000002'
);

insert into public.group_members (group_id, user_id, role) values
  ('00000000-0000-4000-8000-000000000100', '00000000-0000-4000-8000-000000000002', 'member'),
  ('00000000-0000-4000-8000-000000000300', '00000000-0000-4000-8000-000000000002', 'owner'),
  ('00000000-0000-4000-8000-000000000300', '00000000-0000-4000-8000-000000000001', 'member');

-- Fixed IDs so detail and edit URLs can be opened directly, e.g.
-- /recipes/00000000-0000-4000-8000-0000000000a5/edit opens ゆきのノート.
insert into public.recipes (
  id,
  group_id,
  title,
  description,
  ingredients,
  steps,
  tags,
  cooking_time_minutes,
  servings,
  memo,
  created_by,
  updated_by
) values
-- Created by ゆき: her name is shown as the creator.
(
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-000000000100',
  'だし巻き卵',
  'お弁当にも入れやすい、ふんわりした卵焼き。',
  array['卵 3個', 'だし汁 大さじ3', '薄口醤油 小さじ1/2', 'みりん 小さじ1'],
  array['卵を溶き、だし汁と調味料を混ぜる。', '卵焼き器に油をなじませ、卵液を少しずつ流して巻く。', '巻きすで形を整える。'],
  array['卵', '和食', 'お弁当'],
  15,
  2,
  null,
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002'
),
-- Created by けんた, who is no longer a member: shown as 「メンバー」.
(
  '00000000-0000-4000-8000-0000000000a2',
  '00000000-0000-4000-8000-000000000100',
  '具だくさん豚汁',
  '野菜がたっぷりとれる、寒い日の定番。',
  array['豚こま切れ肉 150g', '大根 5cm', 'にんじん 1/2本', 'ごぼう 1/3本', '味噌 大さじ3'],
  array['野菜を食べやすく切る。', '豚肉と野菜を炒め、水を加えて煮る。', '野菜が柔らかくなったら味噌を溶く。'],
  array['汁物', '和食'],
  30,
  4,
  null,
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000003'
),
-- Contains % in the title: searching % or 70% finds only this recipe.
(
  '00000000-0000-4000-8000-0000000000a3',
  '00000000-0000-4000-8000-000000000100',
  'カカオ70%のガトーショコラ',
  '濃厚でしっとりした焼き菓子。',
  array['チョコレート（カカオ70%） 100g', 'バター 60g', '卵 2個', '砂糖 50g', '薄力粉 20g'],
  array['チョコレートとバターを湯せんで溶かす。', '卵と砂糖を混ぜ、溶かしたチョコレートと薄力粉を加える。', '170度のオーブンで25分焼く。'],
  array['お菓子', '週末'],
  50,
  4,
  '一晩冷やすとさらにおいしい。',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
-- Contains _ in a tag: searching _ finds only this recipe.
(
  '00000000-0000-4000-8000-0000000000a4',
  '00000000-0000-4000-8000-000000000100',
  'ひじきの煮物',
  'まとめて作って、数日楽しめる常備菜。',
  array['乾燥ひじき 20g', 'にんじん 1/3本', '油揚げ 1枚', '醤油 大さじ2', '砂糖 大さじ1'],
  array['ひじきを水で戻す。', 'にんじんと油揚げを細切りにする。', '具材を炒め、調味料と水を加えて煮詰める。'],
  array['和食', '作り置き_冷凍OK'],
  25,
  4,
  null,
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
-- In ゆきのノート: opening its URL from the sample note switches notes.
(
  '00000000-0000-4000-8000-0000000000a5',
  '00000000-0000-4000-8000-000000000300',
  'チキンカレー',
  'スパイスの香りがする、ゆき家のカレー。',
  array['鶏もも肉 300g', '玉ねぎ 2個', 'カレールー 1/2箱', 'トマト缶 1/2缶'],
  array['玉ねぎを飴色になるまで炒める。', '鶏肉を加えて焼き色をつける。', '水とトマト缶を加えて煮込み、ルーを溶かす。'],
  array['肉', 'カレー'],
  45,
  4,
  '隠し味にはちみつを少し。',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002'
);

-- Every field at its upper limit, for checking how long text and many lines
-- look and that the edit form accepts them. rpad pads to exactly that many
-- characters. Limits: supabase/migrations/20261113000000_add_input_limits.sql.
insert into public.recipes (
  id,
  group_id,
  title,
  description,
  ingredients,
  steps,
  tags,
  cooking_time_minutes,
  servings,
  source_url,
  memo,
  created_by,
  updated_by
) values (
  '00000000-0000-4000-8000-0000000000a6',
  '00000000-0000-4000-8000-000000000100',
  rpad('上限いっぱいの料理名（100文字）', 100, 'ながいなまえ'),
  rpad('ひとこと説明の上限（500文字）を確かめるためのレシピです。', 500, 'せつめい'),
  array(select rpad(n || '行目の材料 ', 100, 'ざいりょう') from generate_series(1, 50) as n),
  array(select rpad(n || '行目の作り方 ', 500, 'つくりかた') from generate_series(1, 50) as n),
  array(select rpad('タグ' || n, 20, 'たぐ') from generate_series(1, 10) as n),
  4320,
  100,
  rpad('https://example.com/recipes/', 2000, 'a'),
  rpad('メモの上限（2,000文字）を確かめるためのメモです。', 2000, 'めも'),
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);

-- Only the required fields: the detail page hides every optional section.
insert into public.recipes (id, group_id, title, ingredients, steps, created_by, updated_by) values (
  '00000000-0000-4000-8000-0000000000a7',
  '00000000-0000-4000-8000-000000000100',
  'ゆで卵',
  array['卵 2個'],
  array['沸騰した湯に卵を入れ、8分ゆでる。', '冷水にとって殻をむく。'],
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);

-- Latin letters in the title: searching "blt" finds it (case-insensitive).
insert into public.recipes (id, group_id, title, description, ingredients, steps, tags, cooking_time_minutes, servings, created_by, updated_by) values (
  '00000000-0000-4000-8000-0000000000a8',
  '00000000-0000-4000-8000-000000000100',
  'BLTサンド',
  'ベーコン、レタス、トマトの定番サンドイッチ。',
  array['食パン 2枚', 'ベーコン 2枚', 'レタス 2枚', 'トマト 1/2個', 'マヨネーズ 大さじ1'],
  array['ベーコンをカリッと焼く。', 'パンを焼いてマヨネーズを塗る。', '具材をはさんで半分に切る。'],
  array['パン', '朝食'],
  10,
  1,
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);

-- The update trigger would set updated_at to now(), so it is disabled while
-- the seed adjusts existing rows below.
alter table public.recipes disable trigger recipes_set_updated_at;

-- A reference URL of ordinary length: it opens in a new tab.
update public.recipes
set source_url = 'https://example.com/recipes/dashimaki-tamago'
where id = '00000000-0000-4000-8000-0000000000a1';

-- Spread the dates so lists sort by update time in a fixed order.
update public.recipes r
set created_at = now() - d.age, updated_at = now() - d.age
from (values
  ('BLTサンド', interval '3 hours'),
  ('だし巻き卵', interval '1 day'),
  ('豚の生姜焼き', interval '2 days'),
  ('チキンカレー', interval '4 days'),
  ('ふわとろ親子丼', interval '5 days'),
  ('ひじきの煮物', interval '8 days'),
  ('トマトとツナのパスタ', interval '12 days'),
  ('カカオ70%のガトーショコラ', interval '20 days'),
  ('ゆで卵', interval '30 days'),
  ('具だくさん豚汁', interval '40 days')
) as d(title, age)
where r.title = d.title;

-- The upper-limit recipe goes last in the list.
update public.recipes
set created_at = now() - interval '90 days', updated_at = now() - interval '90 days'
where id = '00000000-0000-4000-8000-0000000000a6';

alter table public.recipes enable trigger recipes_set_updated_at;
